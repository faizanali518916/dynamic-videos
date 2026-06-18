import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename } from "node:path";
import { Transform } from "node:stream";

export const getGoogleAccessToken = async ({
  allowUnauthenticated = false,
} = {}) => {
  if (process.env.GOOGLE_ACCESS_TOKEN) {
    return process.env.GOOGLE_ACCESS_TOKEN;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    if (allowUnauthenticated) {
      return null;
    }

    throw new Error(
      "Missing Google OAuth env vars. Required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN",
    );
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
    throw new Error(`Token refresh failed: ${await response.text()}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error(`No access token returned: ${JSON.stringify(data)}`);
  }

  return data.access_token;
};

const formatBytes = (value) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

export async function uploadToDrive(
  filePath,
  {
    onProgress,
    allowUnauthenticated = false,
    shareAnyone = process.env.GOOGLE_DRIVE_SHARE_ANYONE === "true",
  } = {},
) {
  const accessToken = await getGoogleAccessToken({ allowUnauthenticated });
  const fileName = basename(filePath);
  const { size } = await stat(filePath);

  if (!accessToken) {
    return {
      driveConfigured: false,
      driveLink: filePath,
      driveName: fileName,
      fileId: null,
      publicUrl: filePath,
    };
  }

  if (!size) {
    throw new Error("File size is 0 bytes. Nothing to upload.");
  }

  const metadata = {
    name: fileName,
    mimeType: "video/mp4",
    ...(process.env.GOOGLE_DRIVE_FOLDER_ID
      ? { parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] }
      : {}),
  };

  const sessionResponse = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink,webContentLink",
    {
      body: JSON.stringify(metadata),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(size),
        "X-Upload-Content-Type": "video/mp4",
      },
      method: "POST",
    },
  );

  if (!sessionResponse.ok) {
    throw new Error(`Upload session failed: ${await sessionResponse.text()}`);
  }

  const uploadUrl = sessionResponse.headers.get("location");

  if (!uploadUrl) {
    throw new Error("Missing resumable upload URL from Google Drive.");
  }

  const startTime = Date.now();
  let uploaded = 0;

  const progressStream = new Transform({
    transform(chunk, encoding, callback) {
      uploaded += chunk.length;

      const elapsedSeconds = Math.max((Date.now() - startTime) / 1000, 0.001);
      const percent = (uploaded / size) * 100;
      const speedMbps = ((uploaded * 8) / elapsedSeconds / 1024 / 1024).toFixed(
        2,
      );
      const remainingBytes = size - uploaded;
      const bytesPerSecond = uploaded / elapsedSeconds;
      const etaSeconds =
        bytesPerSecond > 0 ? Math.ceil(remainingBytes / bytesPerSecond) : null;

      onProgress?.({
        elapsedSeconds,
        etaSeconds,
        fileName,
        percent,
        size,
        speedMbps,
        uploaded,
      });

      callback(null, chunk);
    },
  });

  const uploadResponse = await fetch(uploadUrl, {
    body: createReadStream(filePath).pipe(progressStream),
    duplex: "half",
    headers: {
      "Content-Length": String(size),
      "Content-Type": "video/mp4",
    },
    method: "PUT",
  });

  if (!uploadResponse.ok) {
    throw new Error(`Drive upload failed: ${await uploadResponse.text()}`);
  }

  const file = await uploadResponse.json();

  if (shareAnyone) {
    const permissionResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}/permissions`,
      {
        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      },
    );

    if (!permissionResponse.ok) {
      throw new Error(
        `Permission update failed: ${await permissionResponse.text()}`,
      );
    }
  }

  return {
    driveConfigured: true,
    driveLink: file.webViewLink ?? file.webContentLink,
    driveName: file.name,
    fileId: file.id,
    ...file,
    publicUrl: `https://drive.google.com/file/d/${file.id}/view`,
  };
}
