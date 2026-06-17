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
import {
  buildTokensFromCaptions,
  extractCaptionsArray,
  getProjectFolders,
  getProjectPaths,
  readJsonFile,
  relativeToRoot,
} from "./project-workflow.mjs";

const DEFAULT_MODEL = "medium.en";
const WHISPER_CPP_VERSION = "1.5.5";

const CACHE_ROOT = path.join(
  process.env.LOCALAPPDATA ||
    path.join(process.env.USERPROFILE, "AppData", "Local"),
  "remotion-whisper",
);

const WHISPER_PATH = path.join(CACHE_ROOT, "whisper.cpp");

const { projectNameArg, model, actionArg } = parseArgs(process.argv.slice(2));

let projectName = projectNameArg;
let action = actionArg;
let projectPaths;

main().catch((err) => {
  fail(err?.stack || err?.message || String(err));
});

async function main() {
  logHeader("Project media generation");

  if (!projectName) {
    projectName = await selectProjectInteractive();
  }

  if (!action) {
    action = await selectActionInteractive();
  }

  projectPaths = getProjectPaths(projectName);

  assertProjectExists();

  switch (action) {
    case "generate-audio":
      await ensureAudio();
      break;
    case "generate-captions":
      await ensureCaptions();
      break;
    case "generate-tokens":
      await ensureTokens();
      break;
    case "full-pipeline":
      await runFullPipeline();
      break;
    default:
      fail(`Unknown action: ${action}`);
  }

  printSummary();
}

function parseArgs(args) {
  let selectedModel = DEFAULT_MODEL;
  let selectedAction = null;
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

    if (arg === "--action" || arg === "-a") {
      const next = args[i + 1];

      if (!next) {
        fail("Missing action value after --action");
      }

      selectedAction = normalizeAction(next);
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
    actionArg: selectedAction,
    model: selectedModel,
    projectNameArg: selectedProject,
  };
}

function normalizeAction(value) {
  const normalized = String(value).trim().toLowerCase();

  if (normalized === "audio" || normalized === "generate-audio") {
    return "generate-audio";
  }

  if (
    normalized === "captions" ||
    normalized === "generate-captions"
  ) {
    return "generate-captions";
  }

  if (normalized === "tokens" || normalized === "generate-tokens") {
    return "generate-tokens";
  }

  if (normalized === "full" || normalized === "full-pipeline") {
    return "full-pipeline";
  }

  fail(
    [
      `Unknown action: ${value}`,
      "",
      "Expected one of:",
      "  generate-audio",
      "  generate-captions",
      "  generate-tokens",
      "  full-pipeline",
    ].join("\n"),
  );
}

async function selectProjectInteractive() {
  const projects = getProjectFolders();

  if (projects.length === 0) {
    fail(
      [
        "No project folders found.",
        "",
        "Expected project folders inside:",
        `  ${path.join(process.cwd(), "src", "projects")}`,
      ].join("\n"),
    );
  }

  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    console.log("");
    console.log("Available projects:");

    for (const project of projects) {
      const status = project.hasTemplate ? "" : " [missing template.json]";
      console.log(`- ${project.name}${status}`);
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
      console.log("Use Up / Down then press Enter.");
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

async function selectActionInteractive() {
  const actions = [
    {
      description: "video.mp4 required",
      label: "Generate audio",
      value: "generate-audio",
    },
    {
      description: "audio.wav required",
      label: "Generate captions",
      value: "generate-captions",
    },
    {
      description: "captions.json required",
      label: "Generate tokens",
      value: "generate-tokens",
    },
    {
      description: "video.mp4 required, generate all subsequent files",
      label: "Full pipeline",
      value: "full-pipeline",
    },
  ];

  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    fail(
      [
        "Interactive action selection is not supported in this terminal.",
        "",
        "Run with one of these flags instead:",
        "  --action generate-audio",
        "  --action generate-captions",
        "  --action generate-tokens",
        "  --action full-pipeline",
      ].join("\n"),
    );
  }

  let selectedIndex = actions.findIndex(
    (actionItem) => actionItem.value === "full-pipeline",
  );

  if (selectedIndex < 0) {
    selectedIndex = 0;
  }

  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);

    process.stdin.setRawMode(true);
    process.stdin.resume();

    const render = () => {
      console.clear();

      console.log("Select action");
      console.log("");
      console.log("Use Up / Down then press Enter.");
      console.log("");

      actions.forEach((actionItem, index) => {
        const isSelected = index === selectedIndex;
        const prefix = isSelected ? ">" : " ";
        const descriptionPrefix = isSelected ? "  " : " ";

        console.log(`${prefix} ${actionItem.label}`);
        console.log(`${descriptionPrefix}${actionItem.description}`);
        console.log("");
      });

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
          selectedIndex === 0 ? actions.length - 1 : selectedIndex - 1;
        render();
        return;
      }

      if (key.name === "down") {
        selectedIndex =
          selectedIndex === actions.length - 1 ? 0 : selectedIndex + 1;
        render();
        return;
      }

      if (key.name === "return") {
        const selectedAction = actions[selectedIndex];

        cleanup();

        console.log(`Selected action: ${selectedAction.label}`);

        resolve(selectedAction.value);
      }
    };

    process.stdin.on("keypress", onKeypress);

    render();
  });
}

function assertProjectExists() {
  if (!fs.existsSync(projectPaths.projectDir)) {
    fail(`Project folder not found: ${projectPaths.projectDir}`);
  }

  if (!fs.statSync(projectPaths.projectDir).isDirectory()) {
    fail(`Project path exists but is not a folder: ${projectPaths.projectDir}`);
  }

  if (!fs.existsSync(projectPaths.templatePath)) {
    fail(
      [
        "template.json not found in project folder.",
        "",
        "Expected:",
        `  ${projectPaths.templatePath}`,
      ].join("\n"),
    );
  }

  logOk(`Project found: ${relativeToRoot(projectPaths.projectDir)}`);
}

async function ensureAudio() {
  if (fs.existsSync(projectPaths.audioPath)) {
    logSkip("audio.wav already exists");
    return;
  }

  assertVideoExists();
  createAudioWav();
}

async function ensureCaptions() {
  if (fs.existsSync(projectPaths.captionsPath)) {
    logSkip("captions.json already exists");
    return;
  }

  if (!fs.existsSync(projectPaths.audioPath)) {
    fail(
      [
        "audio.wav is required before generating captions.",
        "",
        "Missing:",
        `  ${projectPaths.audioPath}`,
        "",
        "Choose Generate audio or Full pipeline first.",
      ].join("\n"),
    );
  }

  await ensureWhisperInstalled();
  await ensureWhisperModelDownloaded();
  await createCaptionsJson();
}

async function ensureTokens() {
  if (fs.existsSync(projectPaths.tokensPath)) {
    logSkip("tokens.json already exists");
    return;
  }

  if (!fs.existsSync(projectPaths.captionsPath)) {
    fail(
      [
        "captions.json is required before generating tokens.",
        "",
        "Missing:",
        `  ${projectPaths.captionsPath}`,
        "",
        "Choose Generate captions or Full pipeline first.",
      ].join("\n"),
    );
  }

  createTokensJson(readCaptionsJson());
}

async function runFullPipeline() {
  const needsVideo = !fs.existsSync(projectPaths.audioPath);
  const needsCaptions = !fs.existsSync(projectPaths.captionsPath);
  const needsTokens = !fs.existsSync(projectPaths.tokensPath);

  if (needsVideo || needsCaptions || needsTokens) {
    assertVideoExists();
  }

  if (needsVideo) {
    createAudioWav();
  } else {
    logSkip("audio.wav already exists");
  }

  if (needsCaptions) {
    await ensureWhisperInstalled();
    await ensureWhisperModelDownloaded();
    await createCaptionsJson();
  } else {
    logSkip("captions.json already exists");
  }

  if (needsTokens) {
    createTokensJson(readCaptionsJson());
  } else {
    logSkip("tokens.json already exists");
  }
}

function assertVideoExists() {
  if (!fs.existsSync(projectPaths.videoPath)) {
    fail(
      [
        "video.mp4 is required for this step.",
        "",
        "Missing:",
        `  ${projectPaths.videoPath}`,
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
      projectPaths.videoPath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-sample_fmt",
      "s16",
      projectPaths.audioPath,
    ],
    {
      stdio: "inherit",
      shell: false,
    },
  );

  if (result.status !== 0) {
    fail("FFmpeg failed while creating audio.wav");
  }

  logOk(`Created ${relativeToRoot(projectPaths.audioPath)}`);
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
    logSkip("Whisper model already exists");
    return;
  }

  logStep("Whisper model missing — downloading");

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
    inputPath: projectPaths.audioPath,
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

  fs.writeFileSync(projectPaths.captionsPath, JSON.stringify(captions, null, 2));

  logOk(
    `Created ${relativeToRoot(projectPaths.captionsPath)} with ${captions.length} caption tokens`,
  );

  return captions;
}

function readCaptionsJson() {
  try {
    const json = readJsonFile(projectPaths.captionsPath);
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
  } catch (error) {
    fail(
      [
        "Failed to read or parse captions.json.",
        "",
        `File: ${projectPaths.captionsPath}`,
        "",
        error.message,
      ].join("\n"),
    );
  }
}

function createTokensJson(captions) {
  logStep("tokens.json missing — creating TikTok-style token ranges");

  const tokens = buildTokensFromCaptions(captions);

  if (!Array.isArray(tokens) || tokens.length === 0) {
    fail("Captions were found, but no tokens could be generated.");
  }

  fs.writeFileSync(projectPaths.tokensPath, JSON.stringify(tokens, null, 2));

  logOk(`Created ${relativeToRoot(projectPaths.tokensPath)} with ${tokens.length} token ranges`);
}

function printSummary() {
  console.log("");
  console.log("DONE");
  console.log(`Project:  ${projectName}`);
  console.log(`Action:   ${action}`);

  if (fs.existsSync(projectPaths.videoPath)) {
    console.log(`Video:    ${relativeToRoot(projectPaths.videoPath)}`);
  }

  if (fs.existsSync(projectPaths.audioPath)) {
    console.log(`Audio:    ${relativeToRoot(projectPaths.audioPath)}`);
  }

  if (fs.existsSync(projectPaths.captionsPath)) {
    console.log(`Captions: ${relativeToRoot(projectPaths.captionsPath)}`);
  }

  if (fs.existsSync(projectPaths.tokensPath)) {
    console.log(`Tokens:   ${relativeToRoot(projectPaths.tokensPath)}`);
  }

  console.log(`Whisper:  ${WHISPER_PATH}`);
  console.log(`Model:    ${model}`);
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
