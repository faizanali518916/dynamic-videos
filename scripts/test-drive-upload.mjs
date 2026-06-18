import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadEnv } from "./load-env.mjs";
import { uploadToDrive } from "./drive-upload.mjs";
import { repoRoot } from "./render-queue.mjs";

await loadEnv();

const inputPath =
  process.argv[2] ??
  resolve(
    repoRoot,
    ".render-jobs",
    "output",
    "process-optimization-3a4a2530-29a1-46e7-adba-32fc98fe37ec.mp4",
  );

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  try {
    let lastLoggedPercent = 0;
    const file = await uploadToDrive(inputPath, {
      onProgress: ({ etaSeconds, percent, size, speedMbps, uploaded }) => {
        const nextPercent = Math.floor(percent);

        if (nextPercent === 100 || nextPercent >= lastLoggedPercent + 5) {
          lastLoggedPercent = nextPercent;
          process.stdout.write(
            `\rUploading ${percent.toFixed(2)}% | ${speedMbps} Mbps | ETA: ${etaSeconds ?? "?"}s | ${uploaded.toLocaleString()} / ${size.toLocaleString()} bytes`,
          );
        }
      },
    });
    process.stdout.write("\n");
    console.log(JSON.stringify(file, null, 2));
  } catch (error) {
    console.error("Upload failed:");
    console.error(error);
    process.exitCode = 1;
  }
}
