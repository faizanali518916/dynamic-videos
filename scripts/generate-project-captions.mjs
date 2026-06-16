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
import { createTikTokStyleCaptions } from "@remotion/captions";

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

const { projectNameArg, model, mode } = parseArgs(process.argv.slice(2));

let projectName = projectNameArg;
let projectDir;
let videoPath;
let audioPath;
let captionsPath;
let tokensPath;

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
  tokensPath = path.join(projectDir, "tokens.json");

  assertProjectExists();

  if (mode === "tokens-only") {
    const captions = readCaptionsJsonFromDisk();

    if (!fs.existsSync(tokensPath)) {
      createTokensJson(captions);
    } else {
      logSkip("tokens.json already exists");
    }

    console.log("");
    console.log("DONE");
    console.log(`Project:  ${projectName}`);
    console.log(`Captions: ${relative(captionsPath)}`);
    console.log(`Tokens:   ${relative(tokensPath)}`);

    return;
  }

  if (fs.existsSync(captionsPath)) {
    const captions = readCaptionsJsonFromDisk();

    logSkip("captions.json already exists");

    if (mode === "captions-and-tokens" && !fs.existsSync(tokensPath)) {
      createTokensJson(captions);
    } else if (mode === "captions-and-tokens") {
      logSkip("tokens.json already exists");
    }

    console.log("");
    console.log("DONE");
    console.log(`Project:  ${projectName}`);
    console.log(`Captions: ${relative(captionsPath)}`);
    if (fs.existsSync(tokensPath)) {
      console.log(`Tokens:   ${relative(tokensPath)}`);
    }

    return;
  }

  assertVideoExists();

  if (!fs.existsSync(audioPath)) {
    createAudioWav();
  } else {
    logSkip("audio.wav already exists");
  }

  await ensureWhisperInstalled();
  await ensureWhisperModelDownloaded();

  const captions = await ensureCaptionsJson();

  if (mode === "captions-and-tokens" && !fs.existsSync(tokensPath)) {
    createTokensJson(captions);
  } else if (mode === "captions-and-tokens") {
    logSkip("tokens.json already exists");
  }

  console.log("");
  console.log("DONE");
  console.log(`Project:  ${projectName}`);
  console.log(`Video:    ${relative(videoPath)}`);
  console.log(`Audio:    ${relative(audioPath)}`);
  console.log(`Captions: ${relative(captionsPath)}`);
  if (fs.existsSync(tokensPath)) {
    console.log(`Tokens:   ${relative(tokensPath)}`);
  }
  console.log(`Whisper:  ${WHISPER_PATH}`);
  console.log(`Model:    ${model}`);
}

function parseArgs(args) {
  let selectedModel = DEFAULT_MODEL;
  let generateTokens = false;
  let tokensOnly = false;
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

    if (arg === "--tokens") {
      generateTokens = true;
      continue;
    }

    if (arg === "--tokens-only") {
      tokensOnly = true;
      continue;
    }

    positional.push(arg);
  }

  const selectedProject = positional[0] ?? null;

  if (positional[1]) {
    selectedModel = positional[1];
  }

  if (generateTokens && tokensOnly) {
    fail("Use either --tokens or --tokens-only, not both.");
  }

  return {
    projectNameArg: selectedProject,
    model: selectedModel,
    mode: tokensOnly ? "tokens-only" : generateTokens ? "captions-and-tokens" : "captions-only",
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
        const captionsStatus = project.hasCaptions
          ? `  [${project.captionCount} captions]`
          : "  [missing captions.json]";
        const tokensStatus = project.hasTokens
          ? `  [${project.tokenCount} tokens]`
          : "  [missing tokens.json]";

        console.log(
          `${prefix} ${project.name}${videoStatus}${captionsStatus}${tokensStatus}`,
        );
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
        hasTokens: fs.existsSync(path.join(folder, "tokens.json")),
        captionCount: countCaptions(path.join(folder, "captions.json")),
        tokenCount: countTokens(path.join(folder, "tokens.json")),
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

function ensureCaptionsJson() {
  if (fs.existsSync(captionsPath)) {
    logSkip("captions.json already exists");
    return readCaptionsJsonFromDisk();
  }

  return createCaptionsJson();
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

  return captions;
}

function createTokensJson(captions) {
  logStep("tokens.json missing — creating TikTok-style token ranges");

  const tokens = createTokensFromCaptions(captions);

  if (!Array.isArray(tokens) || tokens.length === 0) {
    fail("Captions were found, but no tokens could be generated.");
  }

  fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));

  logOk(`Created ${relative(tokensPath)} with ${tokens.length} token ranges`);
}

function createTokensFromCaptions(captions) {
  const pages = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: 1_200,
  }).pages;

  return pages.map((page) => ({
    text: page.text,
    startMs: page.startMs,
    endMs: Math.round(page.startMs + page.durationMs),
  }));
}

function readCaptionsJsonFromDisk() {
  if (!fs.existsSync(captionsPath)) {
    fail(
      [
        "captions.json not found in project folder.",
        "",
        "Expected:",
        `  ${captionsPath}`,
        "",
        "Generate captions first, then run this script again.",
      ].join("\n"),
    );
  }

  let json;

  try {
    const raw = fs.readFileSync(captionsPath, "utf8");
    json = JSON.parse(raw);
  } catch (error) {
    fail(
      [
        "Failed to read or parse captions.json.",
        "",
        `File: ${captionsPath}`,
        "",
        error.message,
      ].join("\n"),
    );
  }

  const captions = extractCaptionsArray(json);

  if (!Array.isArray(captions)) {
    fail(
      [
        "Invalid captions.json format.",
        "",
        "Expected either:",
        "  Caption[]",
        "",
        "Or:",
        '  { "captions": Caption[] }',
      ].join("\n"),
    );
  }

  return captions;
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

function countCaptions(captionsFile) {
  if (!fs.existsSync(captionsFile)) {
    return 0;
  }

  try {
    const raw = fs.readFileSync(captionsFile, "utf8");
    const json = JSON.parse(raw);
    const captions = extractCaptionsArray(json);

    return Array.isArray(captions) ? captions.length : 0;
  } catch {
    return 0;
  }
}

function countTokens(tokensFile) {
  if (!fs.existsSync(tokensFile)) {
    return 0;
  }

  try {
    const raw = fs.readFileSync(tokensFile, "utf8");
    const json = JSON.parse(raw);
    const tokens = extractTokensArray(json);

    return Array.isArray(tokens) ? tokens.length : 0;
  } catch {
    return 0;
  }
}

function extractCaptionsArray(json) {
  if (Array.isArray(json)) {
    return json;
  }

  if (json && Array.isArray(json.captions)) {
    return json.captions;
  }

  return null;
}

function extractTokensArray(json) {
  if (Array.isArray(json)) {
    return json;
  }

  if (json && Array.isArray(json.tokens)) {
    return json.tokens;
  }

  return null;
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
