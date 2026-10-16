# Why Canvas

A free, open tool for getting clear on why something exists. Fill in a short canvas on your own or on a shared screen, or send it round a group and put everyone's answers side by side.

It works for a community, a team, a product, or your own personal why. It's one HTML file with no server, no build step and no dependencies: answers stay in each person's browser until they choose to save or send them.

The styling is deliberately minimal: a plain starting point, not a finished look. Make it yours, by hand or with an AI assistant. Every colour, font and size sits in one block at the top of the styles (see [Make it your own](#make-it-your-own)).

## Using it

1. Open the page and pick what you're working on: a community, a team, a product, or your own personal why. Give it a name if you like, and start.
2. Fill in the canvas on your own or on a shared screen. It saves in your browser as you type. **Save or send** downloads it or copies it.

## Running it with a group

1. On your canvas, choose **Run it with a group**. Add the group's name and your first name, and copy the two links.
2. Send **Share with your group** to everyone. Each person fills in the canvas (about 20 minutes), presses **Save or send** and sends you their copy in a message or email.
3. Open **Your Group view link**. Paste the replies in, prepare highlights on the Board, then **Present** (arrow keys to move, Esc to exit). Export a combined Markdown file to summarise afterwards.

Replies you paste in stay in the browser where you opened Group view. **Clear all** removes them.

To see what a finished canvas looks like, choose **See an example** on the start screen. From there, **See a group’s answers** shows Group view with six sample replies, no session needed.

## Talk it through

The canvas is there to start a conversation. Read the replies together, compare what matters to each person, and work towards a shared why. Group view puts every answer side by side for exactly that.

If you'd like a hand preparing, an AI assistant can help. The [synthesis skill](skills/why-canvas-synthesis/SKILL.md) turns a set of replies into a short prep pack: how aligned the group is on each part of the canvas, a quote here and there, up to three why statements with what each one gives up, questions to ask the room, and gaps. It keeps everyone anonymous and never picks a winner; the room decides. Give it one canvas and it reads that canvas back to you instead.

It works from a folder of `.md` replies, Group view's export, or text pasted in.

- **Any AI assistant:** in Group view, choose **Copy AI prompt** and paste the result in as it is. It includes the instructions and all the replies. Reply names become Person 1, Person 2 and so on; the answers stay as written, so check them for anything private first. Or paste in [SKILL.md](skills/why-canvas-synthesis/SKILL.md) and attach the replies.
- **Assistants that support skills:** add the `skills/why-canvas-synthesis` folder as a skill, then share the replies. In Claude Code, for example, copy it into your project's `.claude/skills/` (or `~/.claude/skills/` for every project).

If you change the skill, run the tests: the page carries a copy of it for Copy AI prompt, and a test keeps the two in step.

## Make it your own

Download `why-canvas.html`. That one file is the whole tool.

1. **Change the words** in the `CANVAS` block at the top: the questions, the prompts, the help notes, even the four types.
2. **Change the look** in the `:root` block at the top of the styles: colours, fonts, type sizes and corners.
3. **Change or remove the credit** in `CANVAS.credit`. Set it to `null` to remove the footer. You don't need to credit anyone.
4. **Put it online** by uploading the file to any static host, or just open it from your computer.

Run the tests after big changes (see below) to check that copies still read back.

## Editing the wording

All wording lives in the `CANVAS` block at the top of `why-canvas.html`. `copy` and `sections` hold the shared wording; `types` holds what changes for community, team, product and personal, including a few titles. Replies are read back by section number and by any type's field title, so keep a title once people have sent copies.

## Restyling

Every colour, font, type size and radius is in the `:root` block at the top of the styles. Spacing is set in the rules below it.

## Running locally

```bash
python3 -m http.server 8766
```

Then open http://localhost:8766/why-canvas.html.

## Tests

```bash
node --test tests/
```

No npm install needed. The tests read the code straight out of `why-canvas.html`.

## Hosting

Any static host works. Upload `why-canvas.html` on its own. There are no analytics or third-party scripts, and settings travel after the `#`, so they never reach the server.

## Licence

MIT. Use it, change it, sell it, rebrand it. See `LICENSE`.
