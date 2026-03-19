# BarExamUS2026

Lean V1 bar exam study app built from an intentionally empty repository.

## Current scope

- Next.js App Router + TypeScript architecture
- JSON-driven legal content model
- Civil Procedure only for V1
- Subject dashboard, topic pages, rule pages, quiz runtime, local progress tracking, and review dashboard

## Content policy

Canonical legal content lives under `content/canonical/` and is the source of truth for the app. Draft additions can be staged under `content/drafts/` for review.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run validate:content
```

## Notes

The environment used to build this repository blocked package installation from the npm registry, so lockfiles and `node_modules` were not generated here.
