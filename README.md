# Why Canvas

A free, open tool for getting clear on why something exists. Fill in a short canvas on your own or on a shared screen, or send it round a group and put everyone's answers side by side.

It works for a community, a team, a product, or your own personal why. It's one HTML file with no server, no build step and no dependencies: answers stay in each person's browser until they choose to save or send them.

## Using it

1. Open the page and pick what you're working on: a community, a team, a product, or your own personal why. Give it a name if you like, and start.
2. Fill in the canvas on your own or on a shared screen. It saves in your browser as you type. **Save or send** downloads it or copies it.

## Running it with a group

1. On your canvas, choose **Run it with a group**. Add the group's name and your first name, and copy the two links.
2. Send **Share with your group** to everyone. Each person fills in the canvas (about 20 minutes), presses **Save or send** and sends you their copy in a message or email.
3. Open **Your Group view link**. Paste the replies in, prepare highlights on the Board, then **Present** (arrow keys to move, Esc to exit). Export a combined Markdown file to summarise afterwards.

Replies you paste in stay in the browser where you opened Group view. **Clear all** removes them.

To see what a finished canvas looks like, choose **See an example** on the start screen. From there, **See a group’s answers** shows Group view with six sample replies, no session needed.

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
