import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const ROOT_DIR = process.cwd();
const PROJECTS_DIR = path.join(ROOT_DIR, "src", "projects");

const { projectNameArg } = parseArgs(process.argv.slice(2));

let projectName = projectNameArg;
let projectDir;
let tokensPath;

main().catch((err) => {
  fail(err?.stack || err?.message || String(err));
});

async function main() {
  if (!projectName) {
    projectName = await selectProjectInteractive();
  }

  projectDir = path.join(PROJECTS_DIR, projectName);
  tokensPath = path.join(projectDir, "tokens.json");

  assertProjectExists();
  assertTokensExist();

  const tokens = readTokensJson();
  const transcript = tokensToLines(tokens);

  if (transcript.length === 0) {
    fail("tokens.json was found, but no transcript lines could be generated.");
  }

  console.log("");
  console.log("=== TRANSCRIPT ===");
  console.log("");
  console.log(transcript.join("\n"));
  console.log("");
}

function parseArgs(args) {
  const positional = [];

  for (const arg of args) {
    positional.push(arg);
  }

  return {
    projectNameArg: positional[0] ?? null,
  };
}

async function selectProjectInteractive() {
  const projects = getProjectFolders();

  if (projects.length === 0) {
    fail(
      [
        "No project folders found.",
        "",
        "Expected project folders inside:",
        `  ${PROJECTS_DIR}`,
      ].join("\n"),
    );
  }

  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    console.log("");
    console.log("Available projects:");

    for (const project of projects) {
      const status = project.hasTokens ? "" : " [missing tokens.json]";
      console.log(`- ${project.name}${status}`);
    }

    fail(
      [
        "",
        "Interactive selection is not supported in this terminal.",
        "Run the script with a project name instead:",
        "",
        "  node scripts/print-project-transcript.mjs <project-name>",
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
        const tokensStatus = project.hasTokens
          ? `  [${project.tokenCount} tokens]`
          : "  [missing tokens.json]";

        console.log(`${prefix} ${project.name}${tokensStatus}`);
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

function getProjectFolders() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    fail(
      [
        "Projects directory not found.",
        "",
        "Expected:",
        `  ${PROJECTS_DIR}`,
      ].join("\n"),
    );
  }

  return fs
    .readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const folder = path.join(PROJECTS_DIR, entry.name);
      const tokensFile = path.join(folder, "tokens.json");

      return {
        name: entry.name,
        folder,
        hasTokens: fs.existsSync(tokensFile),
        tokenCount: countTokens(tokensFile),
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
}

function assertTokensExist() {
  if (!fs.existsSync(tokensPath)) {
    fail(
      [
        "tokens.json not found in project folder.",
        "",
        "Expected:",
        `  ${tokensPath}`,
        "",
        "Generate tokens first with:",
        "  node scripts/generate-project-captions.mjs <project-name> --tokens",
        "",
        "Or create tokens from existing captions with:",
        "  node scripts/generate-project-captions.mjs <project-name> --tokens-only",
      ].join("\n"),
    );
  }
}

function readTokensJson() {
  let json;

  try {
    const raw = fs.readFileSync(tokensPath, "utf8");
    json = JSON.parse(raw);
  } catch (error) {
    fail(
      [
        "Failed to read or parse tokens.json.",
        "",
        `File: ${tokensPath}`,
        "",
        error.message,
      ].join("\n"),
    );
  }

  const tokens = extractTokensArray(json);

  if (!Array.isArray(tokens)) {
    fail(
      [
        "Invalid tokens.json format.",
        "",
        "Expected either:",
        "  Token[]",
        "",
        "Or:",
        '  { "tokens": Token[] }',
        "",
        "Or:",
        '  { "pages": TikTokPage[] }',
      ].join("\n"),
    );
  }

  return tokens;
}

function extractTokensArray(json) {
  if (Array.isArray(json)) {
    return json;
  }

  if (json && Array.isArray(json.tokens)) {
    return json.tokens;
  }

  if (json && Array.isArray(json.pages)) {
    return json.pages.map((page) => ({
      text: page.text,
      startMs: page.startMs,
      endMs:
        typeof page.durationMs === "number"
          ? Math.round(page.startMs + page.durationMs)
          : page.endMs,
    }));
  }

  return null;
}

function tokensToLines(tokens) {
  return tokens
    .map((token) => {
      if (!token || typeof token.text !== "string") {
        return "";
      }

      const text = normalizeText(token.text);
      const startMs = resolveStartMs(token);
      const endMs = resolveEndMs(token, startMs);

      if (!text || startMs === null || endMs === null) {
        return "";
      }

      return `${formatMs(startMs)}-${formatMs(endMs)}: ${text}`;
    })
    .filter(Boolean);
}

function resolveStartMs(token) {
  const value =
    token.startMs ?? token.fromMs ?? token.timestampMs ?? token.start ?? null;

  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function resolveEndMs(token, startMs) {
  const explicitEnd =
    token.endMs ?? token.toMs ?? token.end ?? token.stopMs ?? null;

  if (Number.isFinite(Number(explicitEnd))) {
    return Number(explicitEnd);
  }

  if (Number.isFinite(Number(token.durationMs)) && startMs !== null) {
    return startMs + Number(token.durationMs);
  }

  return null;
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function formatMs(value) {
  return String(Math.max(0, Math.round(value)));
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

function fail(message) {
  console.error("");
  console.error("ERROR");
  console.error(message);
  process.exit(1);
}
