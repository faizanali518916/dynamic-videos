# Dynamic infographic Remotion template

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

This project renders a portrait infographic video from `src/template.json`.
Use the `TemplateBuilder` composition in Remotion Studio to build or reorder
segments, copy the generated JSON, paste it into `src/template.json`, then
preview or render the `InfographicVideo` composition.

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
