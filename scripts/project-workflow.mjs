import fs from "node:fs";
import path from "node:path";
import { createTikTokStyleCaptions } from "@remotion/captions";

export const ROOT_DIR = process.cwd();
export const PROJECTS_DIR = path.join(ROOT_DIR, "src", "projects");
export const TOKENS_COMBINE_WITHIN_MS = 2_000;

export function getProjectPaths(projectName) {
  const projectDir = path.join(PROJECTS_DIR, projectName);

  return {
    audioPath: path.join(projectDir, "audio.wav"),
    captionsPath: path.join(projectDir, "captions.json"),
    projectDir,
    templatePath: path.join(projectDir, "template.json"),
    tokensPath: path.join(projectDir, "tokens.json"),
    videoPath: path.join(projectDir, "video.mp4"),
  };
}

export function getProjectFolders() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const paths = getProjectPaths(entry.name);

      return {
        ...paths,
        captionCount: countCaptions(paths.captionsPath),
        hasAudio: fs.existsSync(paths.audioPath),
        hasCaptions: fs.existsSync(paths.captionsPath),
        hasTemplate: fs.existsSync(paths.templatePath),
        hasTokens: fs.existsSync(paths.tokensPath),
        hasVideo: fs.existsSync(paths.videoPath),
        name: entry.name,
        tokenCount: countTokens(paths.tokensPath),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

export function extractCaptionsArray(json) {
  if (Array.isArray(json)) {
    return json;
  }

  if (json && Array.isArray(json.captions)) {
    return json.captions;
  }

  return null;
}

export function extractTokensArray(json) {
  if (Array.isArray(json)) {
    return json;
  }

  if (json && Array.isArray(json.tokens)) {
    return json.tokens;
  }

  if (json && Array.isArray(json.pages)) {
    return json.pages;
  }

  return null;
}

export function countCaptions(captionsPath) {
  if (!fs.existsSync(captionsPath)) {
    return 0;
  }

  try {
    const json = readJsonFile(captionsPath);
    const captions = extractCaptionsArray(json);

    return Array.isArray(captions) ? captions.length : 0;
  } catch {
    return 0;
  }
}

export function countTokens(tokensPath) {
  if (!fs.existsSync(tokensPath)) {
    return 0;
  }

  try {
    const json = readJsonFile(tokensPath);
    const tokens = extractTokensArray(json);

    return Array.isArray(tokens) ? tokens.length : 0;
  } catch {
    return 0;
  }
}

export function buildTokensFromCaptions(captions) {
  const pages = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: TOKENS_COMBINE_WITHIN_MS,
  }).pages;

  return pages.map((page) => ({
    durationMs: page.durationMs,
    endMs: Math.round(page.startMs + page.durationMs),
    startMs: page.startMs,
    text: page.text,
    tokens: page.tokens.map((token) => ({
      fromMs: token.fromMs,
      text: token.text,
      toMs: token.toMs,
    })),
  }));
}

export function relativeToRoot(filePath) {
  return path.relative(ROOT_DIR, filePath);
}
