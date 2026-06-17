import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadEnv } from "./load-env.mjs";
import {
  ensureJobDirs,
  jobDirs,
  jobRoot,
  listQueuedJobFiles,
  moveJobFile,
  readJobFile,
  repoRoot,
  writeJobMetadata,
} from "./render-queue.mjs";

await loadEnv();

const lockDir = resolve(jobRoot, "worker.lock");
const fps = 30;

const sleep = (milliseconds) =>
  new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds));

const getBrowserExecutable = () => {
  if (process.env.REMOTION_BROWSER_EXECUTABLE) {
    return process.env.REMOTION_BROWSER_EXECUTABLE;
  }

  const windowsChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

  return process.platform === "win32" && existsSync(windowsChrome)
    ? windowsChrome
    : undefined;
};

const getProjectVideoSrc = (projectName) => {
  const videoPath = resolve(
    repoRoot,
    "src",
    "projects",
    projectName,
    "video.mp4",
  );

  return existsSync(videoPath) ? pathToFileURL(videoPath).href : undefined;
};

const getGoogleAccessToken = async () => {
  if (process.env.GOOGLE_ACCESS_TOKEN) {
    return process.env.GOOGLE_ACCESS_TOKEN;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
};

const uploadToDrive = async ({ fileName, outputLocation }) => {
  const accessToken = await getGoogleAccessToken();

  if (!accessToken) {
    console.log("Google Drive credentials not configured; keeping render locally.");
    return {
      driveConfigured: false,
      driveLink: outputLocation,
      driveName: fileName,
      fileId: null,
    };
  }

  console.log(`Uploading ${fileName} to Google Drive...`);
  const boundary = `render-job-${Date.now()}`;
  const metadata = {
    mimeType: "video/mp4",
    name: fileName,
    ...(process.env.GOOGLE_DRIVE_FOLDER_ID
      ? { parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] }
      : {}),
  };
  const videoBytes = await readFile(outputLocation);
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
        metadata,
      )}\r\n--${boundary}\r\nContent-Type: video/mp4\r\n\r\n`,
    ),
    videoBytes,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink,webContentLink",
    {
      body,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(`Drive upload failed: ${await response.text()}`);
  }

  const file = await response.json();

  if (process.env.GOOGLE_DRIVE_SHARE_ANYONE === "true") {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}/permissions`,
      {
        body: JSON.stringify({ role: "reader", type: "anyone" }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      },
    );
  }

  return {
    driveConfigured: true,
    driveLink: file.webViewLink ?? file.webContentLink,
    driveName: file.name,
    fileId: file.id,
  };
};

const toBase64Url = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const sendCompletionEmail = async ({ email, metadata }) => {
  const accessToken = await getGoogleAccessToken();
  const messageLines = [
    process.env.GMAIL_FROM ? `From: ${process.env.GMAIL_FROM}` : null,
    `To: ${email}`,
    `Subject: Your video render is ready: ${metadata.fileName}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    "Your render is complete.",
    "",
    `Drive link: ${metadata.driveLink}`,
    `File name: ${metadata.fileName}`,
    `File size: ${metadata.fileSizeBytes} bytes`,
    `Duration: ${metadata.durationSeconds}s`,
    `Job ID: ${metadata.id}`,
  ].filter(Boolean);

  if (!accessToken || !process.env.GMAIL_FROM) {
    console.log("Gmail credentials not configured; writing email body locally.");
    await writeJobMetadata(jobDirs.notifications, metadata.id, {
      email,
      message: messageLines.join("\n"),
      writtenAt: new Date().toISOString(),
    });
    return { emailConfigured: false };
  }

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      body: JSON.stringify({ raw: toBase64Url(messageLines.join("\r\n")) }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(`Gmail send failed: ${await response.text()}`);
  }

  return { emailConfigured: true };
};

const renderJob = async (job) => {
  const fileName = `${job.projectName}-${job.id}.mp4`;
  const outputLocation = resolve(jobDirs.output, fileName);
  console.log(`Bundling Remotion project for job ${job.id}...`);
  const serveUrl = await bundle({
    entryPoint: resolve(repoRoot, "src", "index.ts"),
    onProgress: () => undefined,
    publicDir: resolve(repoRoot, "public"),
  });
  const inputProps = {
    mediaMode: "render",
    template: job.template,
    transcriptPages: job.transcriptPages,
    videoSrc: getProjectVideoSrc(job.projectName),
  };
  console.log(`Loading composition for job ${job.id}...`);
  const compositions = await getCompositions(serveUrl, { inputProps });
  const composition = compositions.find(({ id }) => id === job.projectName);

  if (!composition) {
    throw new Error(`Composition "${job.projectName}" was not found.`);
  }

  console.log(`Rendering ${fileName}...`);
  let lastProgress = -1;
  await renderMedia({
    browserExecutable: getBrowserExecutable(),
    codec: "h264",
    composition,
    concurrency: 1,
    disallowParallelEncoding: true,
    dumpBrowserLogs: true,
    hardwareAcceleration: "disable",
    inputProps,
    logLevel: "verbose",
    onBrowserLog: (log) => {
      console.log(`[browser:${log.type}] ${log.text}`);
    },
    outputLocation,
    overwrite: true,
    onProgress: ({ progress }) => {
      const percent = Math.floor(progress * 100);

      if (percent >= lastProgress + 10 || percent === 100) {
        lastProgress = percent;
        console.log(`Render progress ${job.id}: ${percent}%`);
      }
    },
    serveUrl,
  });

  const fileStats = await stat(outputLocation);
  const durationSeconds = Math.round(composition.durationInFrames / fps);
  const driveResult = await uploadToDrive({ fileName, outputLocation });
  const metadata = {
    completedAt: new Date().toISOString(),
    driveConfigured: driveResult.driveConfigured,
    driveLink: driveResult.driveLink,
    driveName: driveResult.driveName,
    durationSeconds,
    fileId: driveResult.fileId,
    fileName,
    fileSizeBytes: fileStats.size,
    id: job.id,
    outputLocation,
  };
  const emailResult = await sendCompletionEmail({
    email: job.email,
    metadata,
  });

  return {
    ...metadata,
    ...emailResult,
  };
};

const processJobFile = async (jobFile) => {
  const processingFile = await moveJobFile(jobFile, jobDirs.processing);
  const job = await readJobFile(processingFile);
  console.log(`Processing render job ${job.id} for ${job.email}`);

  try {
    const result = await renderJob(job);
    await writeJobMetadata(jobDirs.completed, job.id, {
      ...job,
      result,
    });
    await rm(processingFile, { force: true });
    console.log(`Completed render job ${job.id}`);
  } catch (error) {
    await writeJobMetadata(jobDirs.failed, job.id, {
      ...job,
      error: error instanceof Error ? error.message : String(error),
      failedAt: new Date().toISOString(),
    });
    await rm(processingFile, { force: true });
    console.error(`Render job ${job.id} failed`, error);
  }
};

export const processQueuedJobs = async ({ watch = false } = {}) => {
  await ensureJobDirs();

  try {
    await mkdir(lockDir);
  } catch {
    console.log("A render worker is already running.");
    return;
  }

  try {
    do {
      const queued = await listQueuedJobFiles();

      for (const jobFile of queued) {
        await processJobFile(jobFile);
      }

      if (!watch) {
        break;
      }

      await sleep(3000);
    } while (watch);
  } finally {
    await rm(lockDir, { force: true, recursive: true });
  }
};

const shouldRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (shouldRun) {
  processQueuedJobs({ watch: process.argv.includes("--watch") }).catch(
    (error) => {
      console.error(error);
      process.exitCode = 1;
    },
  );
}
