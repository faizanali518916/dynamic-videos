# Clone Guide

This repo renders portrait infographic videos with Remotion and a small web
builder.

## Before You Run It

Start by copying `.env.example` to `.env`, then fill in the values for your
Google account and local port.

Make sure these files are present:

- `.env`
- `.env.example`
- `src/projects/process-optimization/template.json`
- `src/projects/process-optimization/video.mp4`
- `src/projects/process-optimization/tokens.json`

Optional project files:

- `src/projects/process-optimization/audio.wav`
- `src/projects/process-optimization/captions.json`

If you add a new project, create the same files under
`src/projects/<project-name>/`.

## `.env` Values

Minimum values used by the worker:

- `PORT`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_DRIVE_FOLDER_ID`
- `GOOGLE_DRIVE_SHARE_ANYONE`
- `GMAIL_FROM`

## Essential Commands

Install dependencies:

```console
npm i
```

Start the web app:

```console
npm run web
```

Start the render worker:

```console
npm run worker
```

Run the Remotion Studio:

```console
npm run dev
```

Render a preview still:

```console
npm run still
```

Render a video directly:

```console
npm run render
```

Test Drive upload only:

```console
node scripts/test-drive-upload.mjs
```

## What Happens When You Render

- the web app creates a queued job under `.render-jobs/queued`
- the worker renders the video
- the worker uploads it to Google Drive with a resumable upload
- the worker emails the Drive link, folder link, and job details when Gmail is configured

## Useful Notes

- The sample project is `src/projects/process-optimization/`
- `video.mp4` is required for video-based projects
- `tokens.json` is required if you want captions
- if Google Drive is not configured, the render stays local in
  `.render-jobs/output`
