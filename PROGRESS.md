# Progress and next steps

The working log for Taneira's 2nd-birthday invite. Read this first in a new session, then `BRIEF.md` (the scroll-craft brief the rebuild follows), then `PLAN.md`.
Last updated 2026-10-22.

## Where things stand

- `main` is the baseline (2026-10-22): one continuous story on one pinned picture (`BRIEF.md` is the plan). The paper caterpillar goes down a vine past her first year (four baby pictures on its leaves), curls up into a chrysalis, comes out as a butterfly and becomes her wings; then the details and the close over the evening garden. The previous baseline, the "one film", is `767dd74`.
- **Milestone 1** (style test) is done and approved. **Milestone 2** (rough build) is rebuilt as the one story. Still open from milestone 2: the iPhone check (next step 4).
- Placeholders still in: the laptop shows the phone composition as a centred column; her winged portrait is version A of two; the evening garden is the dawn layers under a dusk wash.
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
| (branch `feat/vertical-motion`, deleted, was `8b28da9`) | Vertical motion: everything drifting up inside the fixed stage at depth speeds | Rejected: "really bad". Cause: it faked normal scrolling through a timeline that trails the thumb, and moved art several screens (scroll-craft caps parallax near 200 px) |
| `feat/scroll-craft` | Diagnosis against scroll-craft, engine lab, Codex video test, `BRIEF.md` | Brief approved; skeleton (five acts) rejected: "still feels like scenes stitched together" |
| `852714d` (branch `feat/one-story`) | One story: the caterpillar's journey on one pinned picture, with stand-in art | "So far satisfied… just as I expected" (2026-10-22) |
| branch `feat/story-art` (`50afda0`) | The stand-ins replaced: the change as nine Codex drawings played frame by frame (the caterpillar grows on its thread to their size); a baby drawing sheet and four memory pictures from it; `tools/art.py frames` | Merged. "The baby pictures are on point… the change is perfect smooth no jumps" (2026-10-22) |
| branch `fix/phone-notes` (`63dca74`) | Your three notes: the foliage repeated with a hard line once a screen (repaired by Codex into a seamless tile) and the vine ended above the twig; a white bar under the page on Android when the address bar hides (the stage now reaches the large viewport); drawings resting half-dissolved on a slow scroll (now each dissolves in on its own clock). Found on the way: the close's drifting butterflies could make the page a little wider than a phone, so it slid sideways (they're clipped now); the layout audit now judges a fresh page and fails on a drawing resting half-dissolved or more than two drawings showing at once | Merged. "The foliage seam is gone… the white bar is gone on my android phone… mid-change settles cleanly" (2026-10-22) |
| branch `fix/phone-notes-2` | Your notes, round 2: the caterpillar is cut into its paper pieces, each on the stem at its own point along the body, so it bends around the vine's curves, ripples gently as it goes, and hangs straight under its thread (it hung beside it: the old picture's middle was on the thread, not its body); the hatching no longer jumps in size (Codex drew the empty shell 17% bigger, and its open-winged butterfly differed from the one that flies; now the shell is laid over the one before it, and the flying butterfly hangs from it from the start) | Awaiting your phone check |

## Decisions made with you (don't reopen without asking)

- No Three.js. $0 unless something truly needs paying for. Phone first; desktop gets its own landscape art later.
- Paper-cut style; drawing sheet **B** is her likeness; **gold** accent yes; her bows lilac.
- Scroll (2026-10-22): one continuous story on one pinned picture, moving 1:1 with the thumb, with one camera and one character (the caterpillar) from the garden to her portrait. It stops only once, when she has her wings; then the details and the close scroll up over the same garden at evening.
- Mechanism (2026-10-22): scroll-craft's engine, never edited, plus GSAP 3.15.0 for our own moments.
- Peak picture (2026-10-22): $0 Codex drawings played frame by frame, like paper stop-motion. Codex has no video generator, and ChatGPT's Sora has shut down.
- Year-one moments are drawn as her **a year younger**, from the baby photos (see "Her photos").
- Workflow: every change on its own branch in its own worktree, shown to you on its own port, merged only when you say so. Checks must be airtight: run all of them before showing anything.
- Never: the word "RSVP"; the host's phone number on the site; committing or deploying her photos; pushing to GitHub without asking.

## Next, in order

Each is its own branch, approved before merge. Details in `BRIEF.md`.

1. **Phone notes, round 2** (2026-10-22): on `fix/phone-notes-2`, awaiting your phone check.
2. **Signature butterflies:** the first scroll touch releases one, taps add more; they follow the caterpillar, gather at the twig, and settle around "Tell us you're coming".
3. **Details and close polish.**
4. **iPhone check.** Ask which iOS version.
5. **Milestone 3, final art:** desktop landscape art; first-screen weight (538 KB against a 450 KB budget); `og.jpg`, icons and favicon.
6. **Milestone 4, invitation features:** Google Calendar link; `links.html` for `?to=` links; the thank-you line after the WhatsApp tap; `event.json` and `tools/event-sync.mjs`; final portrait (A or B); copy polish.
7. **Milestone 5:** home-screen and offline support; the real-phone checklist; Lighthouse ≥ 90.
8. **Milestone 6, launch** on Cloudflare Pages.

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
  | `npm run layout` | Scrolls the page through 1001 points × 7 setups, including Safari's engine and an SE-sized screen | All ok |
  | `npm run craft -- --url <url> --out shots/craft-phone --width 390 --height 844` | scroll-craft's own harness (also `--width 1440 --height 900`, and `--reduced-motion`): dead scroll, words that never reach full strength, contrast on the real frame | No dead scroll; every line clears 4.5:1 |
  | `npm run flicker` | Headed Chrome under memory pressure; reports flashes, hits and still stretches | No flashes. Hits only at the story's known stops: her landing on the last frame of the story, and the evening coming in |
  | `npm run tasks` | CPU slowed 4× | No task over 50 ms |
  | `npm run shots` | Screenshot sheets | Read them by eye; the layout audit can't see colour contrast or the canvas burst |

- **scroll-craft:** the reference repo isn't vendored. Clone it with `git clone --depth 50 https://github.com/nateherkai/scroll-craft` into a scratch folder to read `SKILL.md`, its references, or run `scripts/shoot.mjs` (run from this repo so `playwright-core` resolves). The engine files get copied into `site/` unedited.
- **Art:**
  - `tools/gen.sh <prompt> <out> [reference images…]` runs Codex image generation on your ChatGPT plan, with no API key. Prompts live in `art/prompts/`, outputs go to `art/raw/` (git-ignored), and the style paragraph is prepended from `art/STYLE.md`.
  - `tools/art.py layer|sprite|segments|butterfly|frames` exports WebPs into `site/img/`; `frames` lines the change's drawings up on the twig and prints their box for `js/story.js`; `segments` cuts the caterpillar into its pieces and prints where each sits. It needs `.venv` with Pillow and numpy.
  - Codex's image tool takes at most 5 reference images.
- **Her photos:**
  - The originals live only in `art/private/` (git-ignored, never deployed): `t1`–`t3` are recent, `t01`–`t06` are from before she turned one.
  - EXIF-stripped, downscaled copies are in `art/private/ref/`: `t*.jpg` and `b1`–`b6.jpg`. In `b1` and `b6` the parents' faces are cropped out.
  - Upload only those copies to Codex.
- **Fonts:** subset to Basic Latin with `pyftsubset` (see `PLAN.md`). GSAP 3.15.0 and ScrollTrigger are vendored in `site/js/vendor/`.

## Known issues

- The flicker test's "hits" count the dissolve into night as a stop (false alarm).
- The canvas burst is invisible to the layout audit; it stays inside the peak's part by construction.
- Laptop: the phone composition shows as a centred column with dark sides (milestone 3).
- First screen is 538 KB against a 450 KB budget (milestone 3).
- iPhone address-bar stutter: not re-tested since the film (next step 4).
- The address-bar fix can't be reproduced on the Mac (desktop Chrome has no hiding bars); it was checked by rewriting every `svh` to be 56 px short of the screen. Confirm on an Android phone and an iPhone.
