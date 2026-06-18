import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";
import { existsSync } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadEnv } from "./load-env.mjs";
import { getGoogleAccessToken, uploadToDrive } from "./drive-upload.mjs";
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

const getDriveConfigured = () =>
  Boolean(
    process.env.GOOGLE_ACCESS_TOKEN ||
      (process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_REFRESH_TOKEN),
  );

const getDriveFolderLink = () => {
  if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
    return null;
  }

  return `https://drive.google.com/drive/folders/${process.env.GOOGLE_DRIVE_FOLDER_ID}`;
};

const toBase64Url = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const sendCompletionEmail = async ({ email, metadata }) => {
  const accessToken = await getGoogleAccessToken({
    allowUnauthenticated: true,
  });
  const driveFolderLink = getDriveFolderLink();
  const messageLines = [
    process.env.GMAIL_FROM ? `From: ${process.env.GMAIL_FROM}` : null,
    `To: ${email}`,
    `Subject: Your video render is ready: ${metadata.fileName}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    "Your render is complete.",
    "",
    driveFolderLink ? `Folder: ${driveFolderLink}` : null,
    `Drive link: ${metadata.driveLink}`,
    `File name: ${metadata.fileName}`,
    `File size: ${metadata.fileSizeBytes} bytes`,
    `Duration: ${metadata.durationSeconds}s`,
    `Job ID: ${metadata.id}`,
  ].filter((line) => line !== null);
  const messageBody = messageLines.join("\r\n");
  const emailSubject = `Your video render is ready: ${metadata.fileName}`;

  console.log(`Preparing email for ${email}...`);
  console.log(`Email subject: ${emailSubject}`);
  console.log(`Drive folder: ${driveFolderLink ?? "(not set)"}`);
  console.log(`Drive link: ${metadata.driveLink}`);
  console.log(
    `Email body: ${messageLines.length} lines, ${messageBody.length} characters`,
  );
  console.log(
    `Email preview: ${messageLines.slice(5, 10).join(" | ") || "(no body preview)"}`,
  );

  if (!accessToken || !process.env.GMAIL_FROM) {
    console.log("Gmail not configured; writing notification locally instead.");
    await writeJobMetadata(jobDirs.notifications, metadata.id, {
      email,
      message: messageBody,
      writtenAt: new Date().toISOString(),
    });
    return { emailConfigured: false };
  }

  console.log(`Sending Gmail message to ${email}...`);
  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      body: JSON.stringify({ raw: toBase64Url(messageBody) }),
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

  console.log(`Email sent to ${email}.`);
  return { emailConfigured: true };
};

const renderJob = async (job) => {
  const fileName = `${job.projectName}-${job.id}.mp4`;
  const outputLocation = resolve(jobDirs.output, fileName);
  const serveUrl = await bundle({
    entryPoint: resolve(repoRoot, "src", "index.ts"),
    onProgress: () => undefined,
    publicDir: resolve(repoRoot, "public"),
  });
  const inputProps = {
    mediaMode: "render",
    template: job.template,
    transcriptPages: job.transcriptPages,
  };
  const compositions = await getCompositions(serveUrl, { inputProps });
  const composition = compositions.find(({ id }) => id === job.projectName);

  if (!composition) {
    throw new Error(`Composition "${job.projectName}" was not found.`);
  }

  console.log(`Rendering job ${job.id}...`);
  let lastLoggedPercent = 0;
  await renderMedia({
    browserExecutable: getBrowserExecutable(),
    codec: "h264",
    composition,
    concurrency: 1,
    disallowParallelEncoding: true,
    dumpBrowserLogs: false,
    hardwareAcceleration: "disable",
    inputProps,
    logLevel: "error",
    outputLocation,
    overwrite: true,
    onProgress: ({ progress }) => {
      const nextPercent = Math.floor(progress * 100);

      if (nextPercent === 100 || nextPercent >= lastLoggedPercent + 5) {
        lastLoggedPercent = nextPercent;
        console.log(`${nextPercent}% done`);
      }
    },
    serveUrl,
  });

  const fileStats = await stat(outputLocation);
  const durationSeconds = Math.round(composition.durationInFrames / fps);
  console.log(`Uploading ${fileName}...`);
  let lastUploadPercent = 0;
  const driveResult = await uploadToDrive(outputLocation, {
    allowUnauthenticated: true,
    onProgress: ({ etaSeconds, percent, size, speedMbps, uploaded }) => {
      const nextPercent = Math.floor(percent);

      if (nextPercent === 100 || nextPercent >= lastUploadPercent + 5) {
        lastUploadPercent = nextPercent;
        console.log(
          `Uploading ${percent.toFixed(2)}% | ${speedMbps} Mbps | ETA: ${etaSeconds ?? "?"}s | ${uploaded.toLocaleString()} / ${size.toLocaleString()} bytes`,
        );
      }
    },
  });
  if (!driveResult.driveConfigured && !getDriveConfigured()) {
    console.log("Google Drive not configured; keeping local output.");
  }
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
