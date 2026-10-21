# Progress and next steps

The working log for Taneira's 2nd-birthday invite. Read this first in a new session, then `PLAN.md` for the design.
Last updated 2026-10-21.

## Where things stand

- `main` is the approved baseline. It holds the whole invite as **one continuous film**: one sticky stage, five parts (garden → year one → chrysalis to wings → invitation → close), one GSAP timeline scrubbed over the page.
- **Milestone 1** (style test) is done and approved. **Milestone 2** (rough build) is built and revised from your phone tests. Still open from milestone 2: the iPhone check of the film and the free wing-unfold upgrade (next steps 3 and 5).
- Placeholders still in: year-one moments are emoji cards with a CSS caterpillar; the laptop shows the phone composition as a centred column; her winged portrait is version A of two.
- Party: Saturday 28 November 2026, 6–8 PM IST, Party Hall, Ramaniyam Magnum, Perungudi. Plan launch Nov 12–14.

## Done, in order

| Commit | What | Your verdict |
|---|---|---|
| — | Plan (`PLAN.md`) | Approved |
| — | Style test: style bible (`art/STYLE.md`), reference sheet A, garden B split into 5 layers, drawing sheet B, gold accent. Fixed a flicker: full-screen layers flashed blank in Chrome under memory pressure, so layers are cropped to their artwork inside a 2:3 frame | Approved ("perfect in phone and Mac") |
| `2b3cbc7` | Rough build baseline: six scenes, peak wing-fold prototype, butterflies, personal greeting, `tools/` | Tested on phones: feedback below |
| `f7e9152` | #1 One chrysalis: the quiet chrysalis and the peak share one stage | Merged |
| (branch `feat/flick-pace`, not merged) | #2 Flick pace: rate-limited the animations after a flick | Superseded: it made the animation lag the thumb. Kept unmerged for reference; safe to delete |
| `bd672de` | One film: one stage and one timeline for the whole page, no pinned scenes (scroll-craft's "worldflight") | Merged: "really better than before" |
| `827898f` | Layout audit (`npm run layout`) and the 9 overlaps and gaps it found (incl. your two: moment cards over "A year ago…", the gap under the closing garden) | Merged |

## Decisions made with you (don't reopen without asking)

- No Three.js. $0 unless something truly needs paying for. Phone first; desktop gets its own landscape art later.
- Paper-cut style; drawing sheet **B** is her likeness; **gold** accent yes; her bows lilac.
- Scroll: one continuous film, nothing pins or stops; the film trails the scroll by 0.5 s (smoothing).
- Year-one moments are drawn as her **a year younger**, from the baby photos (see "Her photos").
- Workflow: every change on its own branch in its own worktree, shown to you on its own port, merged only when you say so. Checks must be airtight: run all of them before showing anything.
- Never: the word "RSVP"; the host's phone number on the site; committing or deploying her photos; pushing to GitHub without asking.

## Next, in order

Each is its own branch, approved before merge.

1. **Vertical motion language** (your note, 2026-10-21). Everything travels with the scroll, upward, at speeds set by depth (text at scroll speed, art faster or slower), like apple.com. Nothing slides sideways or against the scroll except things that move that way themselves (wings, flaps, fluttering butterflies). What breaks the rule today:
   - year-one cards slide sideways and the caterpillar crawls sideways across a fixed screen;
   - in the garden, the near layers move down while you scroll down (a camera push);
   - the invitation and close mostly sit still.
   Idea: the caterpillar climbs a vertical stem up towards the twig the chrysalis hangs from; the moments scroll up past it like a page. Acceptance: `npm run layout` clean, plus a new **motion check** in `tools/check.mjs` that fails if any visible element moves against the scroll or sideways (allow-list: wings, flock, burst), and your phone test.
2. **Butterflies you can play with** (#4): tap anywhere and a couple flutter out from your finger while nearby ones dart away; scroll fast and they flap faster and get swept along. Compositor-only animations, no per-frame work.
3. **Wing unfold upgrade, free** (#5): Codex drawings of the butterfly with crinkled paper wings that smooth out over 3–4 frames (edits of `butterfly-a`, kept aligned), a gold burst of light as they open, then the 3D flaps. Retire the folded-panel prototype and the `-back` images if this replaces them. (The motion check flags the folded butterfly today: the fold doesn't read.)
4. **Year-one art** (#6): first a baby drawing sheet from `b1`–`b6` for you to approve, then four paper scenes: no-teeth smile (`b2`), blank stare (`b1`, `b3`), babbled stories (`b4`), finger heart (from the likeness); a paper caterpillar and stem.
5. **iPhone check of the film.** Ask which iOS version. Research (2026-10-21): Safari 26.4+ runs CSS scroll-driven animations off the main thread, so the garden's motion could move there; GSAP's `normalizeScroll` probably won't stop the address bar collapsing.
6. **Milestone 3, final art:** desktop landscape art; first-screen weight 538 KB against a 450 KB budget (tune wisteria and meadow); `srcset` sizes; remove the faint glow spots in the meadow; `og.jpg`, icons and favicon.
7. **Milestone 4, invitation features:** Google Calendar link for Android; `links.html` (makes `?to=` links); "Thank you! See you there 💜" after the WhatsApp tap; `event.json` and `tools/event-sync.mjs`; final portrait (A or B); copy polish.
8. **Milestone 5:** home-screen and offline support (`manifest.webmanifest`, `sw.js`); the full real-phone checklist in `PLAN.md`; Lighthouse ≥ 90.
9. **Milestone 6, launch:** Cloudflare Pages (you connect the repo), `_headers`, WhatsApp preview card, the personal links.

## How to work here

- **Worktree per change:**
  ```
  git worktree add -b <branch> ../butterfly-bday-wt/<name> main
  cd ../butterfly-bday-wt/<name>
  ln -s ../../butterfly-bday/node_modules node_modules
  ln -s ../../butterfly-bday/.venv .venv
  ```
  Both links are git-ignored. For art work, also link `art/raw` and `art/private` the same way (also ignored).
- **Preview on your phone:**
  - Serve `main` on port 8642 from the main checkout and the branch on port 8643 from its worktree, each with `/usr/bin/python3 -m http.server <port> --bind 0.0.0.0 --directory <path>/site`.
  - Use the system Python: the Mac's firewall blocks Homebrew's Python from accepting connections.
  - Phone URL: `http://<this Mac's Wi-Fi IP>:<port>`. It was 192.168.68.57; check with `ipconfig getifaddr en0`.
- **Checks, all before showing anything** (serve the site first, then pass its URL):

  | Command | What it does | Must show |
  |---|---|---|
  | `npm run layout` | 1001 points × 7 setups, including Safari's engine and an SE-sized screen | All ok |
  | `npm run flicker` | Headed Chrome under memory pressure; reports flashes, hits and still stretches | No flashes. Hits only at known spots: the dissolve into night (detector over-reads it) and the folded butterfly |
  | `npm run tasks` | CPU slowed 4× | No task over 50 ms |
  | `npm run shots` | Screenshot sheets | Read them by eye; the layout audit can't see colour contrast or the canvas burst |

- **Art:**
  - `tools/gen.sh <prompt> <out> [reference images…]` runs Codex image generation on your ChatGPT plan, with no API key. Prompts live in `art/prompts/`, outputs go to `art/raw/` (git-ignored), and the style paragraph is prepended from `art/STYLE.md`.
  - `tools/art.py layer|sprite|butterfly` exports WebPs into `site/img/`. It needs `.venv` with Pillow and numpy.
- **Her photos:**
  - The originals live only in `art/private/` (git-ignored, never deployed): `t1`–`t3` are recent, `t01`–`t06` are from before she turned one.
  - EXIF-stripped, downscaled copies are in `art/private/ref/`: `t*.jpg` and `b1`–`b6.jpg`. In `b1` and `b6` the parents' faces are cropped out.
  - Upload only those copies to Codex.
- **Fonts:** subset to Basic Latin with `pyftsubset` (see `PLAN.md`). GSAP 3.15.0 and ScrollTrigger are vendored in `site/js/vendor/`.

## Known issues

- The peak's folded butterfly barely reads: the folded panels' plain backs hide the wings opening (next step 3).
- The flicker test's "hits" count the dissolve into night as a stop (false alarm).
- The canvas burst is invisible to the layout audit; it stays inside the peak's part by construction.
- Laptop: the phone composition shows as a centred column with dark sides (milestone 3).
- First screen is 538 KB against a 450 KB budget (milestone 3).
- iPhone address-bar stutter: not re-tested since the film (next step 5).
