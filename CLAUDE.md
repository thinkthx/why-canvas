# CLAUDE.md

Read `BRIEF.md` first.

- This is the plain, unbranded version of Why Canvas, MIT licensed, for anyone to download and make their own. Keep it neutral: no brand, no logo, no company or community names. `tests/clean-room.test.mjs` checks every file.
- The author appears only in the optional `CANVAS.credit` footer and in `LICENSE`.
- One self-contained HTML file: no backend, no build step, no dependencies, no analytics or third-party scripts. Ask before changing that.
- All wording lives in the `CANVAS` block. Never hard-code copy in the UI. Copy may use `{group}` and `{host}` only.
- The Markdown is the contract between the canvas and Group view. Sections are read back by number, fields by any type's title; titles may differ by type. Change export and import together, with their round-trip tests.
- Every colour, font, type size and radius lives in the `:root` token block.
- Australian English. No hype words. No em-dashes in copy.
- No logos, trademarks or icon sets from other companies.
- Tests: `node --test tests/`. Commit in small, working steps.
