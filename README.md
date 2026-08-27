# Birthday Party RSVP Form

A self-hosted replacement for the Typeform RSVP invite — a one-question-per-screen
form that writes every submission straight into a Google Sheet. Runs entirely on
Google Apps Script, so there's no hosting cost and nothing to renew.

## Live deployment

The link guests actually use — **https://peterselj.github.io/invite/** — is
**`docs/index.html`**, a self-contained static copy of the form served via GitHub
Pages (Pages is configured to serve from `/docs` on `main`). It POSTs submissions
straight to the Apps Script `.../exec` URL hardcoded near the top of its `<script>`
(`EXEC_URL`) — update that constant if you ever redeploy the Apps Script backend
under a new URL.

`Code.gs` / `Index.html` / `Style.html` are an *alternate* deployment path: paste
them into an Apps Script project (see **One-time setup** below) and Apps Script
serves the form itself, no GitHub Pages involved. Keep the questions in sync
between `docs/index.html` and `Index.html` if you maintain both — right now
`docs/index.html` is the one that's actually live.

## Files

- **`docs/index.html`** — the live form (see above). Edit the `QUESTIONS` object
  near the top of its `<script>` to change questions/choices; edit `EVENT` for
  date/time/location/map link.
- **`docs/versions/`** — earlier concept drafts (choose-your-own-adventure, game
  show, glitch/decrypt themes) kept for reference, not linked from anywhere live.
- **`Code.gs`** — Apps Script server code for the alternate deployment path above.
  The `QUESTIONS` array at the top is the thing to edit if you use this path.
- **`Index.html`** — that alternate form's HTML/CSS/JS (one question per screen,
  animated).
- **`Style.html`** — the visual styling, included into `Index.html`.
- **`preview.html`** — a standalone local preview (mocked submission handler) for
  the `Index.html`/`Style.html` version — not used by Apps Script or GitHub Pages,
  safe to ignore/delete if you don't need it.

## One-time setup

1. **Create a Google Sheet.** This is where responses will land. Any name is fine
   — the script will auto-create a "Responses" tab with headers on first run.
2. In the Sheet, go to **Extensions → Apps Script**. This opens a bound script
   project (empty by default).
3. Delete the placeholder `Code.gs` content and paste in this repo's `Code.gs`.
4. Add two more files in the Apps Script editor (the **+** next to "Files"):
   - An HTML file named `Index`, paste in this repo's `Index.html`.
   - An HTML file named `Style`, paste in this repo's `Style.html`.
5. Click **Deploy → New deployment**.
   - Type: **Web app**.
   - Execute as: **Me**.
   - Who has access: **Anyone with the link**.
   - Click **Deploy**, then authorize the script when prompted (it needs
     permission to write to the Sheet it's bound to).
6. Copy the `.../exec` URL you're given — that's the link you text/email to guests.

## Editing questions next year

Open the Apps Script project, edit the `QUESTIONS` array in `Code.gs`, save, then
**Deploy → Manage deployments → (pencil icon) → New version → Deploy**. The public
URL stays the same — no need to re-share a new link.

Each question looks like:

```js
{ id: 'attending', type: 'choice', prompt: 'Will you be joining the party?',
  choices: ["Yes, I'll be there!", "Sadly, I can't make it", "Still figuring it out"] },
```

- `type: 'choice'` → pick-one buttons (auto-advances on click).
- `type: 'text'` → freeform text input.
- `required: false` → makes a question skippable (defaults to required).
- `id` becomes the column header in the "Responses" sheet, so keep it short and
  stable once you've started collecting responses.

## Current placeholder questions

The shipped `QUESTIONS` are placeholders in the spirit of last year's "mad-libs"
story-style form (fill-in-the-blank sentence + straight RSVP fields at the end).
Swap them out for this year's actual questions whenever you're ready — that's the
only edit needed.

## Testing

1. Deploy, then open the `.../exec` URL yourself and submit a test response.
2. Confirm a new row appears in the "Responses" tab of your Sheet with the right
   columns.
3. Send the link to guests once you're happy with it.
