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
Use the `TemplateBuilder` composition in Remotion Studio to build or reorder
segments, copy the generated JSON, paste it into the active project's
`template.json`, then preview or render the `InfographicVideo` composition.

Each video project lives in `src/projects/<project-name>/` and contains:

- `template.json` for the Remotion template data
- `video.mp4` for the source video
- `transcript.json` for on-screen captions

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

When `intro` is true, the render starts with a short hook scene using
`hookText`. When `outro` is true, the render ends with `public/outro.mp4`.
`caption` can only be enabled when `videoBased` is true.

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

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
