import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const jobRoot = resolve(root, ".render-jobs");
export const jobDirs = {
  completed: resolve(jobRoot, "completed"),
  failed: resolve(jobRoot, "failed"),
  notifications: resolve(jobRoot, "notifications"),
  output: resolve(jobRoot, "output"),
  processing: resolve(jobRoot, "processing"),
  queued: resolve(jobRoot, "queued"),
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const projectPattern = /^[a-z0-9_-]+$/i;

export const ensureJobDirs = async () => {
  await Promise.all(
    Object.values(jobDirs).map((directory) =>
      mkdir(directory, { recursive: true }),
    ),
  );
};

export const validateRenderPayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  if (typeof payload.email !== "string" || !emailPattern.test(payload.email)) {
    throw new Error("A valid email address is required.");
  }

  if (
    typeof payload.projectName !== "string" ||
    !projectPattern.test(payload.projectName)
  ) {
    throw new Error("A valid project name is required.");
  }

  if (!payload.template || typeof payload.template !== "object") {
    throw new Error("A template JSON object is required.");
  }

  if (typeof payload.template.title !== "string") {
    throw new Error("The template must include a title.");
  }

  if (!Array.isArray(payload.template.segments)) {
    throw new Error("The template must include segments.");
  }
};

export const queueRenderJob = async (payload) => {
  validateRenderPayload(payload);
  await ensureJobDirs();

  const now = new Date().toISOString();
  const id = randomUUID();
  const job = {
    createdAt: now,
    email: payload.email.trim(),
    id,
    projectName: payload.projectName,
    template: payload.template,
    transcriptPages: Array.isArray(payload.transcriptPages)
      ? payload.transcriptPages
      : [],
  };

  await writeFile(
    resolve(jobDirs.queued, `${id}.json`),
    `${JSON.stringify(job, null, 2)}\n`,
    "utf8",
  );

  return job;
};

export const listQueuedJobFiles = async () => {
  await ensureJobDirs();
  const files = await readdir(jobDirs.queued);

  return files
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => resolve(jobDirs.queued, file));
};

export const readJobFile = async (file) =>
  JSON.parse(await readFile(file, "utf8"));

export const moveJobFile = async (from, targetDirectory) => {
  await mkdir(targetDirectory, { recursive: true });
  const target = resolve(targetDirectory, from.split(/[\\/]/).at(-1));
  await rename(from, target);

  return target;
};

export const writeJobMetadata = async (directory, id, metadata) => {
  await mkdir(directory, { recursive: true });
  await writeFile(
    resolve(directory, `${id}.json`),
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8",
  );
};

export const repoRoot = root;
