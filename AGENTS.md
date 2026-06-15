<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any Next.js code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# TekPanel Frontend Rules

TekPanel is a notification-first Android inbox, not a generic SaaS dashboard. The UI must feel like a focused mobile utility for a small business owner who wants to see customer message notifications quickly.

## Hard Product Shape

- Keep the main experience single-screen and inbox-first.
- Do not turn the app back into a manual CRM dashboard.
- Do not add decorative marketing sections, hero pages, pricing sections, onboarding tours, or generic analytics cards.
- Keep Android capture, channel filtering, local queue, and localStorage behavior intact unless the task explicitly targets native capture.

## Anti-Slop Design Rules

- Do not use purple gradients, glassy orb backgrounds, bokeh blobs, random glow effects, or generic SaaS card grids.
- Do not make everything a floating card. Use cards only for message rows, channel rows, and compact panels.
- Avoid oversized hero typography. This is an operational mobile app, not a landing page.
- Avoid fake depth from heavy shadows. Prefer native-feeling separators, compact spacing, and readable hierarchy.
- Platform identity should come from source badges, color accents, and message metadata, not huge decorative logos.
- Empty states must be quiet and short. They should not explain obvious UI.

## Mobile-First UI Direction

- Design first for 360-430px wide Android WebView.
- Tap targets must be at least 44px high when practical.
- No horizontal overflow at 360px, 390px, or 430px.
- Text must wrap or truncate intentionally. Never let action buttons push content off-screen.
- Prefer dense, readable rows over giant cards.
- The top area should show: app name, current inbox count, channel settings access, clear-screen action.

## Design System Rules

- Before changing UI, inspect `src/app/page.tsx`, `src/app/globals.css`, and any existing theme/source badge constants.
- Reuse the existing `sourceThemes` model for platform colors.
- If adding design tokens, add them deliberately in `globals.css` or existing constants. Do not scatter arbitrary hex values across many components.
- Keep typography practical. Use the existing font setup unless a task explicitly asks for a new brand direction.
- Maintain contrast suitable for outdoor phone use.

## Required Frontend Workflow

For any visual/frontend task:

1. Read the relevant Next.js docs under `node_modules/next/dist/docs/` before editing Next.js files.
2. Inspect existing UI structure and tests before changing code.
3. Use the local project skills when relevant:
   - `.agents/skills/frontend-design/SKILL.md`
   - `.agents/skills/frontend-dev-guidelines/SKILL.md`
   - `.agents/skills/playwright-visual-qa/SKILL.md`
4. Make scoped edits only.
5. Run `npm run lint`.
6. Run `npm run test:web` for UI changes.
7. Run `npm run test:native` if Android bridge/native capture assumptions could be affected.
8. For Android-visible changes, run `npm run mobile:sync`, `npm run android:build`, and install the debug APK when a device is connected.

## Visual QA Gate

- Verify mobile at 390px minimum through the existing smoke test.
- If taking manual screenshots with Chrome, distinguish true mobile emulation from a desktop window cropped to 390px.
- If a screenshot shows clipping or overflow, fix it before reporting success.
- Final reports must mention what was visually checked and what remains subjective.
