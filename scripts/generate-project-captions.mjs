import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { spawnSync } from "node:child_process";
import {
  downloadWhisperModel,
  installWhisperCpp,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";

const ROOT_DIR = process.cwd();
const PROJECTS_DIR = path.join(ROOT_DIR, "src", "projects");

const WHISPER_CPP_VERSION = "1.5.5";
const DEFAULT_MODEL = "medium.en";

const CACHE_ROOT = path.join(
  process.env.LOCALAPPDATA ||
    path.join(process.env.USERPROFILE, "AppData", "Local"),
  "remotion-whisper",
);

const WHISPER_PATH = path.join(CACHE_ROOT, "whisper.cpp");

const { projectNameArg, model } = parseArgs(process.argv.slice(2));

let projectName = projectNameArg;
let projectDir;
let videoPath;
let audioPath;
let captionsPath;

main().catch((err) => {
  fail(err?.stack || err?.message || String(err));
});

async function main() {
  logHeader("Project caption generation");

  if (!projectName) {
    projectName = await selectProjectInteractive();
  }

  projectDir = path.join(PROJECTS_DIR, projectName);
  videoPath = path.join(projectDir, "video.mp4");
  audioPath = path.join(projectDir, "audio.wav");
  captionsPath = path.join(projectDir, "captions.json");

  assertProjectExists();
  assertVideoExists();

  if (!fs.existsSync(audioPath)) {
    createAudioWav();
  } else {
    logSkip("audio.wav already exists");
  }

  await ensureWhisperInstalled();
  await ensureWhisperModelDownloaded();

  if (!fs.existsSync(captionsPath)) {
    await createCaptionsJson();
  } else {
    logSkip("captions.json already exists");
  }

  console.log("");
  console.log("DONE");
  console.log(`Project:  ${projectName}`);
  console.log(`Video:    ${relative(videoPath)}`);
  console.log(`Audio:    ${relative(audioPath)}`);
  console.log(`Captions: ${relative(captionsPath)}`);
  console.log(`Whisper:  ${WHISPER_PATH}`);
  console.log(`Model:    ${model}`);
}

function parseArgs(args) {
  let selectedModel = DEFAULT_MODEL;
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--model" || arg === "-m") {
      const next = args[i + 1];

      if (!next) {
        fail("Missing model value after --model");
      }

      selectedModel = next;
      i++;
      continue;
    }

    positional.push(arg);
  }

  const selectedProject = positional[0] ?? null;

  if (positional[1]) {
    selectedModel = positional[1];
  }

  return {
    projectNameArg: selectedProject,
    model: selectedModel,
  };
}

async function selectProjectInteractive() {
  const projects = getProjectFolders();

  if (projects.length === 0) {
    fail(
      [
        "No project folders found.",
        "",
        `Expected project folders inside:`,
        `  ${PROJECTS_DIR}`,
      ].join("\n"),
    );
  }

  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    console.log("");
    console.log("Available projects:");

    for (const project of projects) {
      console.log(`- ${project.name}`);
    }

    fail(
      [
        "",
        "Interactive selection is not supported in this terminal.",
        "Run the script with a project name instead:",
        "",
        "  node scripts/generate-project-captions.mjs <project-name>",
      ].join("\n"),
    );
  }

  let selectedIndex = 0;

  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);

    process.stdin.setRawMode(true);
    process.stdin.resume();

    const render = () => {
      console.clear();

      console.log("Select project");
      console.log("");
      console.log("Use ↑ / ↓ then press Enter.");
      console.log("");

      projects.forEach((project, index) => {
        const isSelected = index === selectedIndex;
        const prefix = isSelected ? ">" : " ";
        const videoStatus = project.hasVideo ? "" : "  [missing video.mp4]";
        const captionsStatus = project.hasCaptions ? "  [captions exist]" : "";

        console.log(`${prefix} ${project.name}${videoStatus}${captionsStatus}`);
      });

      console.log("");
      console.log(`Model: ${model}`);
      console.log("");
      console.log("Press Ctrl+C to cancel.");
    };

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off("keypress", onKeypress);
      console.clear();
    };

    const onKeypress = (_str, key) => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        process.exit(130);
      }

      if (key.name === "up") {
        selectedIndex =
          selectedIndex === 0 ? projects.length - 1 : selectedIndex - 1;
        render();
        return;
      }

      if (key.name === "down") {
        selectedIndex =
          selectedIndex === projects.length - 1 ? 0 : selectedIndex + 1;
        render();
        return;
      }

      if (key.name === "return") {
        const selectedProject = projects[selectedIndex];

        cleanup();

        console.log(`Selected project: ${selectedProject.name}`);

        resolve(selectedProject.name);
      }
    };

    process.stdin.on("keypress", onKeypress);

    render();
  });
}

function getProjectFolders() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    fail(
      [
        "Projects directory not found.",
        "",
        `Expected:`,
        `  ${PROJECTS_DIR}`,
      ].join("\n"),
    );
  }

  return fs
    .readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const folder = path.join(PROJECTS_DIR, entry.name);

      return {
        name: entry.name,
        folder,
        hasVideo: fs.existsSync(path.join(folder, "video.mp4")),
        hasCaptions: fs.existsSync(path.join(folder, "captions.json")),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function assertProjectExists() {
  if (!fs.existsSync(projectDir)) {
    fail(`Project folder not found: ${projectDir}`);
  }

  if (!fs.statSync(projectDir).isDirectory()) {
    fail(`Project path exists but is not a folder: ${projectDir}`);
  }

  logOk(`Project found: ${relative(projectDir)}`);
}

function assertVideoExists() {
  if (!fs.existsSync(videoPath)) {
    fail(
      [
        "video.mp4 not found in project folder.",
        "",
        "Expected:",
        `  ${videoPath}`,
        "",
        "Put your source video here:",
        `  src/projects/${projectName}/video.mp4`,
      ].join("\n"),
    );
  }

  logOk("video.mp4 found");
}

function createAudioWav() {
  logStep("audio.wav missing — creating it with FFmpeg");

  assertCommandAvailable("ffmpeg");

  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      videoPath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-sample_fmt",
      "s16",
      audioPath,
    ],
    {
      stdio: "inherit",
      shell: false,
    },
  );

  if (result.status !== 0) {
    fail("FFmpeg failed while creating audio.wav");
  }

  logOk(`Created ${relative(audioPath)}`);
}

async function ensureWhisperInstalled() {
  fs.mkdirSync(CACHE_ROOT, { recursive: true });

  if (isWhisperInstalled()) {
    logSkip(`Whisper.cpp already installed at ${WHISPER_PATH}`);
    return;
  }

  if (fs.existsSync(WHISPER_PATH)) {
    logStep("Broken Whisper.cpp folder found — deleting it");
    fs.rmSync(WHISPER_PATH, { recursive: true, force: true });
  }

  logStep("Whisper.cpp missing — installing into no-space cache folder");

  const previousCwd = process.cwd();

  try {
    process.chdir(CACHE_ROOT);

    const result = await installWhisperCpp({
      to: WHISPER_PATH,
      version: WHISPER_CPP_VERSION,
      printOutput: true,
    });

    if (result?.alreadyExisted) {
      logSkip("Remotion says Whisper.cpp already existed");
    }
  } finally {
    process.chdir(previousCwd);
  }

  if (!isWhisperInstalled()) {
    fail(
      [
        "Whisper.cpp install finished, but no executable was found.",
        "",
        `Checked: ${WHISPER_PATH}`,
        "",
        "Delete this folder and run again:",
        `  ${WHISPER_PATH}`,
      ].join("\n"),
    );
  }

  logOk("Whisper.cpp installed");
}

async function ensureWhisperModelDownloaded() {
  if (isWhisperModelDownloaded()) {
    logSkip(`Whisper model already exists: ${model}`);
    return;
  }

  logStep(`Whisper model missing — downloading: ${model}`);

  fs.mkdirSync(WHISPER_PATH, { recursive: true });

  const previousCwd = process.cwd();

  try {
    process.chdir(CACHE_ROOT);

    await downloadWhisperModel({
      model,
      folder: WHISPER_PATH,
      printOutput: true,
    });
  } finally {
    process.chdir(previousCwd);
  }

  if (!isWhisperModelDownloaded()) {
    fail(
      [
        "Model download finished, but model file was not found.",
        "",
        "Checked these possible paths:",
        ...getModelPathCandidates().map((candidate) => `  ${candidate}`),
      ].join("\n"),
    );
  }

  logOk(`Whisper model downloaded: ${model}`);
}

async function createCaptionsJson() {
  logStep("captions.json missing — transcribing audio");

  const whisperCppOutput = await transcribe({
    inputPath: audioPath,
    whisperPath: WHISPER_PATH,
    whisperCppVersion: WHISPER_CPP_VERSION,
    model,
    tokenLevelTimestamps: true,
    splitOnWord: true,
    printOutput: true,
  });

  const { captions } = toCaptions({
    whisperCppOutput,
  });

  if (!Array.isArray(captions) || captions.length === 0) {
    fail("Transcription completed, but no captions were generated.");
  }

  fs.writeFileSync(captionsPath, JSON.stringify(captions, null, 2));

  logOk(
    `Created ${relative(captionsPath)} with ${captions.length} caption tokens`,
  );
}

function isWhisperInstalled() {
  const possibleExecutables = [
    "main.exe",
    "main",
    path.join("build", "bin", "main.exe"),
    path.join("build", "bin", "main"),
    path.join("build", "bin", "whisper-cli.exe"),
    path.join("build", "bin", "whisper-cli"),
  ];

  return possibleExecutables.some((file) =>
    fs.existsSync(path.join(WHISPER_PATH, file)),
  );
}

function getModelPathCandidates() {
  return [
    path.join(WHISPER_PATH, "models", `ggml-${model}.bin`),
    path.join(WHISPER_PATH, `ggml-${model}.bin`),
  ];
}

function isWhisperModelDownloaded() {
  return getModelPathCandidates().some((candidate) => fs.existsSync(candidate));
}

function assertCommandAvailable(command) {
  const result = spawnSync(command, ["-version"], {
    stdio: "ignore",
    shell: false,
  });

  if (result.status !== 0) {
    fail(
      [
        `${command} is not available in PATH.`,
        "",
        "Install FFmpeg first:",
        "  winget install -e --id Gyan.FFmpeg",
        "",
        "Then close PowerShell, reopen it, and try again.",
      ].join("\n"),
    );
  }
}

function relative(filePath) {
  return path.relative(ROOT_DIR, filePath);
}

function logHeader(text) {
  console.log("");
  console.log(`=== ${text} ===`);
}

function logStep(text) {
  console.log("");
  console.log(`> ${text}`);
}

function logOk(text) {
  console.log(`[OK] ${text}`);
}

function logSkip(text) {
  console.log(`[SKIP] ${text}`);
}

function fail(message) {
  console.error("");
  console.error("ERROR");
  console.error(message);
  process.exit(1);
}
