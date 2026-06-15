---
name: frontend-dev-guidelines
description: "Use for TekPanel React/Next.js frontend implementation quality, TypeScript safety, component structure, localStorage handling, and mobile responsive behavior."
---

# TekPanel Frontend Dev Guidelines

Use this skill for implementation quality after design direction is clear.

## Next.js Rule

Before editing Next.js files, read the relevant guide in `node_modules/next/dist/docs/`. The installed Next.js version may differ from model assumptions.

## Codebase Rules

- `src/app/page.tsx` is currently the main client UI and Android bridge surface.
- `src/app/globals.css` owns global CSS and theme primitives.
- Keep local-first behavior. Do not add server APIs, auth, cloud sync, social tokens, scraping, OCR, or Accessibility service.
- Do not split into many files unless it clearly reduces complexity.
- Preserve `captureMethod: "manual" | "paste" | "share" | "notification"`.
- Preserve channel allowlist and native queue behavior.

## React Rules

- Keep browser-only APIs inside client code.
- Guard Android plugin calls with native-platform checks.
- Keep localStorage parsing defensive.
- Deduplicate native imports by id.
- Avoid state writes before initial storage load has completed.

## Mobile Rules

- Test at 390px width through `npm run test:web`.
- No horizontal overflow.
- No clipped buttons.
- No inputs unless the user explicitly asks to bring manual entry back.
- Prefer semantic rows and buttons over clickable divs.

## Verification

Run:

```bash
npm run lint
npm run test:web
```

Run `npm run test:native` if any bridge/native assumption changes.

For Android visible changes:

```bash
npm run mobile:sync
npm run android:build
```
