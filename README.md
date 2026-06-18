# Dynamic infographic Remotion template

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

This project renders a portrait infographic video from a project folder under
`src/projects`.
Use the standalone web builder to edit the form or JSON, preview the video, and
submit an async render request. Users do not need to open the codebase or paste
JSON into source files.

Each video project lives in `src/projects/<project-name>/` and contains:

- `template.json` for the Remotion template data
- `video.mp4` for the source video
- `tokens.json` for word-level on-screen captions

The current project is `src/projects/process-optimization/`.

Each segment in `template.json` can set `durationSeconds` to control how long
that layout stays on screen. The renderer clamps the value to the selected
layout's supported duration range, with a minimum animation-safe duration of
3 seconds. Layout item counts are also bounded per layout, so flexible layouts
can render different numbers of items while fixed layouts keep their required
count.

Templates can also be source-video based:

```json
{
  "title": "Operating System For Modern Growth",
  "videoBased": true,
  "intro": true,
  "outro": true,
  "caption": true,
  "hookText": "What if your growth system could make cleaner decisions faster?",
  "segments": [
    { "videoShown": true, "durationSeconds": 4 },
    {
      "videoShown": false,
      "layout": "flowchart",
      "durationSeconds": 5,
      "title": "From signal to shipped decision",
      "items": ["Market signal", "Research brief", "Priority stack"]
    }
  ]
}
```

When `videoBased` is true, `video.mp4` runs continuously as the audio bed.
Scenes with `videoShown: true` show the source video and only need
`durationSeconds`; scenes with `videoShown: false` hide the source video and
render the animation layout while the source audio keeps playing.

When `intro` is true, `hookText` appears as an overlay at the start of the
video without adding duration. Captions start after the intro overlay finishes.
When `outro` is true, the render ends with `public/outro.mp4`. `caption` can
only be enabled when `videoBased` is true.

## Quick Start

For a fresh clone, start by copying `.env.example` to `.env`, then fill in your
Google values and local port.

Make sure these files exist before you run anything:

- `.env` created from `.env.example`
- `src/projects/<project-name>/template.json`
- `src/projects/<project-name>/video.mp4` for video-based projects
- `src/projects/<project-name>/tokens.json` if you want captions
- `src/projects/<project-name>/audio.wav` if your workflow uses the local audio
- `src/projects/<project-name>/captions.json` if you regenerate captions locally

The sample project in this repo is `src/projects/process-optimization/`.

## Web Builder

The builder is the user-facing app. It has a form, an editable JSON panel, a
live Remotion Player preview, and an email field for render delivery.

```console
npm run web
```

Open `http://localhost:4173`. The current JSON in the browser is the source of
truth for both the preview and the render request.

Submitting a render returns immediately. The request is stored as a JSON job in
`.render-jobs/queued`, then the worker renders the MP4, uploads it to Google
Drive with a resumable upload when credentials are configured, and sends the
Drive link by email.

If Google credentials are not configured, completed MP4s stay in
`.render-jobs/output` and the email body is written to
`.render-jobs/notifications`.

## Render Worker

The web server wakes the worker for each submitted job. You can also keep a
worker running explicitly:

```console
npm run worker
```

The app is database-free: queued, completed, failed, output, and notification
records are plain files under `.render-jobs`.

Drive and Gmail use Google OAuth credentials with `drive.file` and
`gmail.send` scopes. Put them in `.env` before you start the app. The worker
logs render progress at 5% steps, upload progress with speed and ETA, and the
email subject plus Drive folder and file link before sending.

## Essential Commands

**Install Dependencies**

```console
npm i
```

**Start Remotion Studio**

```console
npm run dev
```

**Render video**

```console
npm run render
```

**Render a preview still**

```console
npm run still
```

**Build the standalone JSON builder page**

```console
npm run build:builder
```

Then open `public/template-builder.html` in a browser.

**Start the web app**

```console
npm run web
```

**Start the worker**

```console
npm run worker
```

**Test Drive upload only**

```console
node scripts/test-drive-upload.mjs
```

The render target is 1080 x 1920 at 30 fps. Segment duration is fixed by layout
type in `src/layoutCatalog.ts`. Rendering is configured to use the installed
Chrome executable at `C:\Program Files\Google\Chrome\Application\chrome.exe`.

Brand defaults are documented in `BRAND_GUIDELINES.md` and mirrored in `src/brand.ts`.

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
