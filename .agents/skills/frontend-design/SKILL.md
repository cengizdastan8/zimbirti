---
name: frontend-design
description: "Use for TekPanel frontend redesign, mobile UI polish, anti-AI-slop visual direction, and notification inbox interface quality."
---

# TekPanel Frontend Design

Use this skill whenever TekPanel UI, layout, visual polish, message cards, empty states, channel settings, or mobile app feel is involved.

## Product Context

TekPanel is a local-first Android notification inbox for small businesses. It captures visible customer message notifications from selected channels and shows them in a single screen.

The operator opens the app to answer one question:

`What customer messages arrived and which ones can I clear from the panel?`

## Aesthetic Direction

Default direction: utilitarian mobile inbox with subtle editorial polish.

This means:

- compact headerbun
- readable message rows
- platform-colored source badges
- quiet background
- clear separators
- restrained shadows
- no hero layout
- no decorative dashboard blocks

## Avoid

- purple gradients
- generic SaaS dashboards
- glassmorphism panels
- giant rounded cards everywhere
- centered empty-state illustrations that dominate the screen
- fake analytics widgets unless the user asks
- marketing-page visual language
- random icon sets
- overanimated UI

## Design Checklist

Before coding:

1. Identify the screen state: empty inbox, populated inbox, channel panel, read/clear actions.
2. Decide whether the change improves scanning speed on a phone.
3. Preserve notification-first behavior.

When coding:

1. Keep the main content within 360-430px mobile constraints.
2. Keep tap targets reachable with thumb use.
3. Use `sourceThemes` for channel identity.
4. Keep message row content ordered as source, sender, time, text, action.
5. Use truncation deliberately for package names and long sender names.

After coding:

1. Check empty and populated states.
2. Check channel panel open/closed.
3. Check no horizontal overflow.
4. Run `npm run lint` and `npm run test:web`.

## Signature Detail

TekPanel should be remembered for a clean "message ledger" feel: each captured item looks like a real operational record, not a decorative card.
