# Content Layout

- `canonical/` contains source-of-truth legal content used by the app.
- `drafts/` is reserved for proposed additions or revisions that require review before replacing canonical assets.
- UI components must consume canonical JSON through `lib/content.ts`; substantive doctrine should not be hardcoded in React components.

## Review policy

Canonical JSON files are the authoritative assets for the app. Agents may read and validate them, and may generate draft additions separately, but they should not automatically overwrite canonical content without human review.
