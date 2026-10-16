# Why Canvas: product brief

Date: 15 October 2026. Status: built. This brief wins where the code and the brief differ.

A free, open canvas for getting clear on why something exists: a community, a team, a product or your own work. It is MIT licensed: anyone can download it and make it their own.

## Purpose

Any leader who wants their group to agree on why it exists can set up a session in a minute, send one link, collect everyone's canvas and run the conversation from a board. Visitors who never run a session can still see the board through a demo.

Success looks like:

- A facilitator goes from the bare page to a shareable link in under a minute, without reading instructions.
- A participant fills in and sends the canvas in about 20 minutes, on a phone or a laptop.
- Someone arriving from LinkedIn sees the board and present mode within two clicks.
- Nothing in the page or README names a person, community or company, apart from the author credit in the footer (added 16 October).

## Decisions

| Topic | Decision |
|---|---|
| Name | Why Canvas. Repo `~/dev/why-canvas`, page `why-canvas.html`. |
| Audience | Anyone picks **community**, **team**, **product** or **personal** on the start screen. |
| Canvas | The same eight sections and fields for every type. Wording, and a few titles, change. |
| Flow | Canvas first. Run it with a group builds the links. Settings travel in the URL hash. |
| Look | Neutral. All visual values in one token block, to be restyled later. Light only. No logo. |
| Demo | Six sample replies per type, loaded in memory, never touching real data. |
| Repo | Public, MIT licence. The unbranded version, for anyone to download and make their own. |
| Architecture | One self-contained HTML file, no backend, no build step, no dependencies, no analytics. |
| Timing | Two to four weeks. |

Cut on purpose: a send-by date, a choice of channel, hiding sections, dark mode, a logo, a copyright line on the page (revisit when the website exists).

## Approach

The file started as a copy of an earlier single-event canvas and was generalised: shared copy and type sheets, a setup screen, settings in the link, a demo, and a neutral restyle.

## Routes

One file, three entry points, all in the hash so settings never reach a web server's logs.

| URL | View |
|---|---|
| `why-canvas.html` (no hash) | Start screen |
| `#type=team&group=Acme&host=Sam` | Participant |
| `#group-view&type=team&group=Acme&host=Sam` | Group view (old `#facilitator` links still work) |
| `#demo=community` (or `team`, `product`) | Group view with sample answers |

The hash is read with `URLSearchParams`. Route changes on `hashchange`, as today.

### Settings

- `type`: one of `community`, `team`, `product`. Missing or unknown on a participant link shows setup with the note "This link is missing part of its setup. Ask whoever sent it for a new one." On a facilitator link, a missing or unknown type shows setup instead, so the facilitator can make a proper link.
- `group`: optional. Trimmed, control characters stripped, capped at 60 characters. When absent, copy uses the type's fallback ("this community", "this team", "this product").
- `host`: optional first name. Same cleaning, capped at 30 characters. When absent, copy uses "your facilitator".
- Settings are always rendered as text (`textContent` or the existing `h()` text path), never as HTML.

Reading and writing settings are pure functions in the core script (`readSettings(hash)`, `settingsHash(settings, view)`) so they can be tested.

## Start screen and Run it with a group (changed 15 October)

The canvas is the front door. Most people use it on their own or on a shared screen; collecting answers from a group is an option, not a gate.

**Start screen** (no hash, or a link without a known type):
1. "What are you working on?" with four options: community, team, product, personal.
2. Its name (optional, hidden for personal) and your first name (optional).
3. **Start** opens the canvas under its own link (`#type=team&group=…`), so a reload or a bookmark brings the draft back.
4. **Continue from a copy** restores a pasted canvas under the type and group it was written for. **See an example** opens one filled-in canvas of the chosen type (`#example=team`), read-only and never saved, under a line saying whose it is and what it is for. From there, **See a group’s answers** opens the Group view demo. **Pick up where you left off** returns to the last canvas used on this device.

**Run it with a group** (on the canvas, for whoever started it; hidden on a group's link):
- Group name and your first name, prefilled from the canvas.
- Two links with Copy buttons: **Share with your group** (the canvas link with `host`), and **Your Group view link (keep this)**.
- **Open Group view** and **Back to my canvas**.

**Group view** is the former facilitator view, renamed. Its links are `#group-view&…`; old `#facilitator` links still open it.

**Save or send** (formerly Share) and **Run it with a group** open as dialogs over the canvas (16 October), so Back, Esc and Close all return to it. Save or send asks for a first name if the canvas has none, because the Markdown opens with it, and keeps the raw Markdown behind Show the Markdown.

**Credit.** A subtle footer on every screen credits the author and links to the code, from `CANVAS.credit`. Set it to `null` to remove the footer.

**Copy without a host** is written for working alone (save or download); a link with `host` switches to the group copy ("Share it with Sam"). The wording model holds this as `copy` (the solo base) and `groupCopy`, at both canvas and type level.

**Personal** is a fourth type for your own why. The hero is still the people you help; you are the guide. It speaks in the first person, has its own purpose sentence ("I want to help…"), and has no demo (`solo: true`).

**Titles per type.** A type may override section titles (`sectionTitles`) and field titles (in `fields`). The exporter writes the reply's own type's titles; the importer finds sections by number and fields by any type's title, so copies of any type, and older copies, still import.

## Wording model

The `CANVAS` block keeps two parts.

**`CANVAS.sections`** is the shared structure: section `id`, `number`, `title`, and for each field its `id`, `title`, default `prompt` and optional `example`, plus the purpose blanks and their `prefillFrom`. Field and section titles are identical for every type, because they are the Markdown contract.

**`CANVAS.types`** holds a copy sheet for `community`, `team` and `product`. Each sheet has:

- `label` and `description` (for the setup screen) and `fallback` (the phrase used when there is no group name).
- All screen copy: question, intro, "How this works" steps, share-screen copy.
- `help`: per-section "why" and "think about" notes.
- `fields`: per-field overrides of `prompt` and `example`, keyed by field id. Anything not overridden uses the shared default.
- `template`: the purpose sentence for this type. Its blanks must be the shared purpose field ids.

Copy may use two tokens, `{group}` and `{host}`. No other substitution. A line that reads badly with a token is written out in full in the sheet.

Resolving copy is a pure core function (`copyFor(type, settings)`), so the UI never reads the sheets directly.

## Markdown format

As today, with generic naming and two new metadata lines:

```markdown
# Why Canvas: Priya

Canvas: why-canvas (v1)
Type: team
Group: Payments team
Updated: 2026-10-20T09:14:00.000Z

## 1. Who it's for (the hero)

### Primary audience

…
```

- Parsing does not depend on the type: section numbers and field titles are shared.
- The purpose sentence is written with the reply's type template and, as today, is not read back as an answer.
- The facilitator view compares each reply's `Type` and `Group` with its own settings (case-insensitive, trimmed). A mismatch is imported but carries a visible warning on that reply ("From a different group: Acme"), so mixed sessions are noticed, not hidden.
- Replies with no `Type` or `Group` line import without a warning.

## Storage

Keys are scoped so one person can take part in, or run, more than one session in a browser:

- Participant draft: `whycanvas:<type>:<group key>:draft`
- Facilitator: `whycanvas:<type>:<group key>:facilitator`

The group key is the cleaned, lower-cased group name, or `_` when there is none. Blocked storage is reported as today.

## Facilitator view

Unchanged from the earlier canvas (import by paste or file, received list, board, highlights, anonymise with per-section shuffle, present mode, combined Markdown and JSON export, clear all), with these changes:

- Copy comes from the type's sheet.
- An empty view offers **Try it with sample answers**, which switches to the demo.
- The group-mismatch warning above.

## Demo

- Eighteen made-up replies: six per type, each type with its own fictional group (for example a local developer meetup, a payments team, a small budgeting app). Generic first names. Group names are checked against obvious real brands, and the owner approves them before release.
- The answers are written to make the board useful: lengths from one line to a paragraph, broad agreement on the hero, a real split on the villain, and one reply with several sections left blank.
- Stored as Markdown in their own `<script id="samples" type="text/plain">` block and loaded through the real importer.
- The demo runs in memory only. It reads and writes no storage, so a facilitator's real replies and highlights are untouched. A banner reads "Sample answers. Nothing here is real." with a community, team and product switch and an **Exit demo** button. Highlights made in the demo are discarded on exit.

## Look

- Keep the Board layout and the existing discipline: flat, hairline borders, one accent.
- Use the system font stack and one neutral accent that meets WCAG 2.2 AA on white.
- Every colour, font, size, spacing and radius value lives in one `:root` token block at the top of the styles, with a comment saying it is the place to restyle.
- No logo. The menu bar shows "Why Canvas" as plain text.
- Accessibility: keyboard access, visible focus, labels on every input, 44 px targets, polite save announcements, assertive errors, and present-mode sizes for reading across a room.

## File layout in the new repo

```
why-canvas/
  why-canvas.html     the app: CANVAS config, tokens and styles, core, samples, UI
  BRIEF.md            generic product brief, adapted from this spec
  CLAUDE.md           working rules
  README.md           what it is, how to run, test and host it
  tests/load.mjs      reads the config, core and samples out of the HTML
  tests/core.test.mjs
```

Order inside the HTML: `canvas-config`, styles (tokens first), `core`, `samples`, UI.

## Testing

`node --test tests/`, no npm dependencies. The existing tests carry over, renamed and adjusted. New tests:

- Settings: hash round trip; cleaning, length caps and control-character stripping; unknown or missing type; missing group and host fall back.
- Copy: every type sheet overrides only field and section ids that exist; every type template uses exactly the shared purpose blanks; every token in every sheet resolves; no unresolved `{…}` reaches resolved copy.
- Markdown: a reply survives the round trip for each type; `Type` and `Group` are written and read; group and type mismatch warnings; replies without the new lines still import.
- Demo: every sample parses with no warnings or errors, and each type has six.
- Clean-room guard: `why-canvas.html` and `README.md` name no person, community or company (the test holds the list, case-sensitive so the `-apple-system` font name passes), and the HTML has no embedded images.

The UI is checked by hand in a browser at phone and laptop widths for each type, and with the demo.

## Acceptance criteria

- [ ] From the bare page, a facilitator creates both links for each type in under a minute.
- [ ] A participant link shows that type's wording with the group and host names, and falls back cleanly when either is missing.
- [ ] A participant can fill in, close, return to and send the canvas on phone and desktop.
- [ ] Export and import round-trip without loss for all three types (tested).
- [ ] The facilitator view imports replies, warns on a different group, and keeps board, anonymise, present and exports working.
- [ ] The demo shows all three types, and leaves real replies and highlights untouched.
- [ ] Restyling needs edits to the token block only.
- [ ] The clean-room guard test passes.
- [ ] The README explains setup, use, tests and static hosting.

## Open questions

- Copyright or attribution line on the page, and a licence statement in the repo, once the website exists.
- Final hosting address, which decides the example links in the README.
