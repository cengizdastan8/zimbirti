---
name: playwright-visual-qa
description: "Use after TekPanel UI changes to verify real browser rendering, mobile responsive layout, overflow, key states, and screenshot-driven visual QA."
---

# TekPanel Playwright Visual QA

Use this skill after frontend UI edits.

## Required States

Verify these states:

- empty inbox
- seeded messages
- after marking one message Okundu
- channel panel open
- channel toggled off
- corrupted localStorage fallback

The existing `scripts/web-smoke.mjs` already covers these states and checks horizontal overflow.

## Commands

```bash
npm run test:web
```

For native assumptions:

```bash
npm run test:native
```

For Android WebView packaging:

```bash
npm run mobile:sync
npm run android:build
```

## Visual Checklist

- 390px wide mobile viewport does not overflow horizontally.
- Buttons do not clip.
- Empty state does not dominate the screen.
- Message list stays readable with long sender names and package names.
- Channel colors are recognizable but not visually loud.
- Okundu action is visible inside each message row.
- Channel panel rows are tappable and easy to scan.

## Reporting

Final report should say:

- what states were checked
- what commands passed
- whether APK was rebuilt/installed
- remaining subjective design risk, if the user may still dislike the visual direction
