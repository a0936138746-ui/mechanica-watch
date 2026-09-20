# MECHANICA

[Open the interactive watch](https://a0936138746-ui.github.io/mechanica-watch/)

58 selectable components, 12-stage exploded view, independent part inspection, bilingual information, movement animation and guided UX. Drag to rotate; wheel or pinch to zoom.

## Build and deployment

Node.js 22 or later. No install step, API key or backend is required.

```
node build.mjs
```

Production output is `dist/`. GitHub Actions builds and deploys this folder automatically after each push to `main`. Pages source must be **GitHub Actions**. Do not publish the repository root: it contains development tools intentionally excluded from the build.

All runtime assets are relative and support the `/mechanica-watch/` subpath. QA recording, development panel and diagnostic collection are excluded from production. Accepted visual design remains unchanged.

Physical-device touch and Android frame-rate testing remain outstanding. This is mechanical visual art, not a manufacturing simulator. Three.js license: `vendor/THREE-LICENSE.txt`.
