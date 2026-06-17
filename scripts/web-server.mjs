import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { queueRenderJob, repoRoot } from "./render-queue.mjs";
import { loadEnv } from "./load-env.mjs";
import { getProjectFolders, readJsonFile } from "./project-workflow.mjs";

await loadEnv();

const root = repoRoot;
const publicDir = resolve(root, "public");
const projectsDir = resolve(root, "src", "projects");
const workerPath = resolve(root, "scripts", "render-worker.mjs");
const port = Number(process.env.PORT ?? 4173);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".wav": "audio/wav",
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
};

const readJsonBody = async (request) =>
  new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let size = 0;

    request.on("data", (chunk) => {
      size += chunk.length;

      if (size > 6 * 1024 * 1024) {
        rejectBody(new Error("Request body is too large."));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => {
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        rejectBody(new Error("Request body must be valid JSON."));
      }
    });
    request.on("error", rejectBody);
  });

const isInside = (target, parent) =>
  target === parent || target.startsWith(`${parent}${sep}`);

const projectNamePattern = /^[a-z0-9_-]+$/i;

const toProjectSummary = (project) => ({
  captions: readTemplateFlag(project.templatePath, "caption"),
  hasTemplate: project.hasTemplate,
  hasTokens: project.hasTokens,
  hasVideo: project.hasVideo,
  name: project.name,
  videoBased: readTemplateFlag(project.templatePath, "videoBased"),
});

const readTemplateFlag = (templatePath, key) => {
  try {
    const template = readJsonFile(templatePath);

    return template?.[key] === true;
  } catch {
    return false;
  }
};

const getProjectPayload = (projectName) => {
  if (!projectNamePattern.test(projectName)) {
    throw new Error("Invalid project name.");
  }

  const project = getProjectFolders().find(({ name }) => name === projectName);

  if (!project || !project.hasTemplate) {
    throw new Error(`Project "${projectName}" does not have template.json.`);
  }

  const template = readJsonFile(project.templatePath);
  const transcriptPages = project.hasTokens
    ? readJsonFile(project.tokensPath)
    : [];

  return {
    ...toProjectSummary(project),
    previewVideoSrc: project.hasVideo
      ? `/projects/${project.name}/video.mp4`
      : undefined,
    template,
    transcriptPages: Array.isArray(transcriptPages) ? transcriptPages : [],
  };
};

const parseRangeHeader = (rangeHeader, fileSize) => {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader ?? "");

  if (!match) {
    return null;
  }

  const [, startText, endText] = match;
  const start =
    startText === "" ? Math.max(fileSize - Number(endText), 0) : Number(startText);
  const end =
    endText === "" || startText === "" ? fileSize - 1 : Number(endText);

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end >= fileSize ||
    start > end
  ) {
    return null;
  }

  return { end, start };
};

const serveFile = async (request, requestPath, response) => {
  const decodedPath = decodeURIComponent(requestPath);
  const isAppRoute =
    decodedPath !== "/" &&
    !decodedPath.startsWith("/projects/") &&
    extname(decodedPath) === "";
  const publicTarget =
    decodedPath === "/" || isAppRoute
      ? resolve(publicDir, "template-builder.html")
      : resolve(publicDir, decodedPath.replace(/^\/+/, ""));
  const projectTarget = decodedPath.startsWith("/projects/")
    ? resolve(projectsDir, decodedPath.replace(/^\/projects\/+/, ""))
    : null;
  const target = projectTarget ?? publicTarget;
  const allowedRoot = projectTarget ? projectsDir : publicDir;

  if (!isInside(target, allowedRoot)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    await access(target);
    const fileStats = await stat(target);
    const contentType = mimeTypes[extname(target)] ?? "application/octet-stream";
    const range = parseRangeHeader(request.headers.range, fileStats.size);
    const commonHeaders = {
      "Accept-Ranges": "bytes",
      "Content-Type": contentType,
    };

    if (request.headers.range && !range) {
      response.writeHead(416, {
        ...commonHeaders,
        "Content-Range": `bytes */${fileStats.size}`,
      });
      response.end();
      return;
    }

    if (range) {
      response.writeHead(206, {
        ...commonHeaders,
        "Content-Length": range.end - range.start + 1,
        "Content-Range": `bytes ${range.start}-${range.end}/${fileStats.size}`,
      });

      if (request.method === "HEAD") {
        response.end();
        return;
      }

      createReadStream(target, range).pipe(response);
      return;
    }

    response.writeHead(200, {
      ...commonHeaders,
      "Content-Length": fileStats.size,
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
};

const wakeWorker = () => {
  const child = spawn(process.execPath, [workerPath, "--once"], {
    cwd: root,
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`Render worker exited with code ${code}`);
    }
  });
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/projects") {
    sendJson(
      response,
      200,
      getProjectFolders()
        .filter(({ hasTemplate }) => hasTemplate)
        .map(toProjectSummary),
    );
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/projects/")) {
    try {
      const projectName = decodeURIComponent(
        url.pathname.replace(/^\/api\/projects\/+/, ""),
      );

      sendJson(response, 200, getProjectPayload(projectName));
    } catch (error) {
      sendJson(response, 404, {
        error: error instanceof Error ? error.message : "Project not found.",
      });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/render-jobs") {
    try {
      const payload = await readJsonBody(request);
      const job = await queueRenderJob(payload);
      console.log(`Queued render job ${job.id} for ${job.email}`);
      wakeWorker();
      sendJson(response, 202, {
        jobId: job.id,
        message: `Render queued. The Drive link will be emailed to ${job.email}.`,
      });
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : "Invalid request.",
      });
    }
    return;
  }

  if (request.method === "GET" || request.method === "HEAD") {
    await serveFile(request, url.pathname, response);
    return;
  }

  response.writeHead(405);
  response.end("Method not allowed");
});

server.listen(port, () => {
  console.log(`Template builder running at http://localhost:${port}`);
});
