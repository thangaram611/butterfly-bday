# Progress and next steps

The working log for Taneira's 2nd-birthday invite. Read this first in a new session, then `BRIEF.md` (the scroll-craft brief the rebuild follows), then `PLAN.md`.
Last updated 2026-10-22.

## Where things stand

- `main` is the approved baseline. It holds the whole invite as **one continuous film**: one sticky stage, five parts (garden → year one → chrysalis to wings → invitation → close), one GSAP timeline scrubbed over the page.
- **Rebuild under way (2026-10-22)** on branch `feat/scroll-craft`, following nateherkai/scroll-craft properly: its engine unedited plus GSAP, real sections that scroll like apple.com, art for every scene, a $0 Codex-rendered peak. `BRIEF.md` is the plan and is waiting for your approval.
- **Milestone 1** (style test) is done and approved. **Milestone 2** (rough build) is built and revised from your phone tests. Still open from milestone 2: the iPhone check and the wing-unfold upgrade (next steps 7 and 3).
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
| (branch `feat/vertical-motion`, deleted, was `8b28da9`) | Vertical motion: everything drifting up inside the fixed stage at depth speeds | Rejected: "really bad". Cause: it faked normal scrolling through a timeline that trails the thumb, and moved art several screens (scroll-craft caps parallax near 200 px) |
| `feat/scroll-craft` | Diagnosis against scroll-craft, engine lab, Codex video test, `BRIEF.md` | Brief awaiting approval |

## Decisions made with you (don't reopen without asking)

- No Three.js. $0 unless something truly needs paying for. Phone first; desktop gets its own landscape art later.
- Paper-cut style; drawing sheet **B** is her likeness; **gold** accent yes; her bows lilac.
- Scroll (reopened 2026-10-22): scroll-craft's act mode, filmic one-shot. Real sections that move 1:1 with the thumb; short pins where a picture plays; nothing ever stops dead. Replaces the one-film fixed stage.
- Mechanism (2026-10-22): scroll-craft's engine, never edited, plus GSAP 3.15.0 for our own moments.
- Peak picture (2026-10-22): a $0 frame sequence rendered by Codex from our paper art. Codex has no video generator, and ChatGPT's Sora has shut down.
- Year-one moments are drawn as her **a year younger**, from the baby photos (see "Her photos").
- Workflow: every change on its own branch in its own worktree, shown to you on its own port, merged only when you say so. Checks must be airtight: run all of them before showing anything.
- Never: the word "RSVP"; the host's phone number on the site; committing or deploying her photos; pushing to GitHub without asking.

## Next, in order

Each is its own branch, approved before merge. Details in `BRIEF.md`.

1. **Approve `BRIEF.md`.**
2. **The new skeleton with today's art:** scroll-craft engine plus GSAP, five acts (garden, year one into dusk, the peak, the details on the night sky, the evening close), the taste-floor fixes. You judge the scroll feel before new art is made. The layout audit is reworked to step through real scroll instead of a timeline.
3. **The peak:** Codex in-between drawings (shell cracking, crumpled to open wings), a rendered frame sequence, her portrait revealed with an iris wipe. Retire the CSS fold and the `-back` images.
4. **Year-one art:** first a baby drawing sheet from `b1`–`b6` for you to approve, then four paper pictures (no-teeth smile `b2`, serious stare `b1`/`b3`, babbled stories `b4`, finger heart) and a paper caterpillar.
5. **The details on the night sky and the evening close.**
6. **Signature butterflies:** tap and they fly out of your finger, follow you, and settle around "Tell us you're coming".
7. **iPhone check.** Ask which iOS version.
8. **Milestone 3, final art:** desktop landscape art; first-screen weight (538 KB against a 450 KB budget); `og.jpg`, icons and favicon.
9. **Milestone 4, invitation features:** Google Calendar link; `links.html` for `?to=` links; the thank-you line after the WhatsApp tap; `event.json` and `tools/event-sync.mjs`; final portrait (A or B); copy polish.
10. **Milestone 5:** home-screen and offline support; the real-phone checklist; Lighthouse ≥ 90.
11. **Milestone 6, launch** on Cloudflare Pages.

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

- **scroll-craft:** the reference repo isn't vendored. Clone it with `git clone --depth 50 https://github.com/nateherkai/scroll-craft` into a scratch folder to read `SKILL.md`, its references, or run `scripts/shoot.mjs` (run from this repo so `playwright-core` resolves). The engine files get copied into `site/` unedited.
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
