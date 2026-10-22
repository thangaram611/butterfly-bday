# Brief: Taneira is turning two

The scroll-craft brief for the rebuild, written before any act or asset exists. Everything downstream (`site/`, the art, the checks) reads from this file.
Follows nateherkai/scroll-craft `SKILL.md` steps 0 to 2, `feel.md` and `uniqueness.md`. Written 2026-10-22.

**How it was written:** from your answers across our sessions, quoted where you said it. Lines marked *authored* are my decisions where you delegated ("its your call ultimately") or never said; change any of them.

## Step 0: the eight topics

1. **Vibe.** *Authored:* butterflies, violet, handmade paper, joyful. Your words: "The theme of the birthday this time is butterflies and main color is violet". Art style: "Layered paper-cut". References: "take apple site for example … no matter how hard i scroll or flick it doesnt stop anywhere it just scrolls smoothly to the bottom. the animations are a part of the scroll". Anti-reference: last year's site, "too laggy and not perfect on the asserts and didnt quite hit the mobile audience properly".
2. **The journey, in your words.** "Caterpillar to butterfly". The year-one moments: "her 'smile with no teeth', her 'Blank staring', her 'Confident wobbly stories', her 'love you with finger gesture'". Then the party details, then "Tell us you're coming", signed "Taneira's family".
3. **Energy curve.** *Authored:* calm open, tender middle, a hush, one big peak, calm and clear details, a warm ending.
4. **Feeling and the one moment.** The peak is the butterfly's wings opening (approved in `PLAN.md`). Guests must feel "definitely included" ("The thing about RSVP is that the guest should not think that they are optional").
5. **The one thing no other site does.** Your seed: "Some of the small butterflies that reacts to scroll and touch would be a great addition". It becomes the signature move below.
6. **Aesthetic range.** *Authored:* **playful** (scroll-craft `uniqueness.md` §5: "Kids, games, consumer apps"), a picture book for a two-year-old's family. Not premium-minimal.
7. **One world or distinct scenes.** Distinct scenes that flow like apple.com: "I like apple style but should we reimagine the scenes and how they scroll?", then "Use the draft plan".
8. **Assets we have.** Her photos in `art/private` (never published); the approved paper-cut garden (5 layers), drawing sheet B (her likeness), butterflies A and B, the chrysalis, her winged portrait (version A). Codex image generation on your ChatGPT plan. No footage. $0 ("Try to make it $0 as much as possible").

## Step 1: what it is and what it does

- **What and who:** the invitation to Taneira's 2nd birthday, for family and friends, opened from WhatsApp, almost always on a phone.
- **What the guest must believe by the end:** *we can't wait to see you there.* You're invited, not asked whether you might come.
- **The one next action:** **Tell us you're coming** (a WhatsApp message to the family; no number on the page). One label, used everywhere. Add to calendar and Directions are tools inside the details, not calls to action.
- **World:** genuinely illustrated, because this is a children's invite (`worlds.md` allows that and asks to commit to it properly). The style preamble in `art/STYLE.md` is reused word for word in every prompt. *To add:* a negative list ("not 3D render, not clay, not plastic, no digital glow"), which `worlds.md` says holds models on style.

**Journey** (what the guest learns):

| Beat | |
|---|---|
| 1 Welcome | something lovely is happening for Taneira |
| 2 Remember | a year ago she was our little caterpillar |
| 3 Anticipate | something has been changing |
| 4 Celebrate | she's got her wings: she's turning two |
| 5 Know | when, where, what to wear |
| 6 Come | we've saved a spot for you |

## Step 2: grammar, signature move, gate, feeling curve, score

### Grammar: filmic one-shot

One linear story with one arc, where the guest should feel carried, not navigate (`uniqueness.md` §2.1). Why the other seven lost:

- **Continuous world:** needs one place travelled through on seam-matched video. Our story moves through a year and a day, not one place. It is also what `main` does today, and it reads as a slideshow.
- **Chaptered editorial:** a printed feature with hard cuts and a type-only title page. Wrong for a picture book.
- **Live surface:** there is no product to operate.
- **Typographic poster:** type as the imagery. Here the paper art and her portrait are the point.
- **Gallery / catalog:** there is no range of objects.
- **Split stage:** no two-sided argument. "Then and now" is a sequence, not a comparison.
- **Rhythmic cutlist:** fast hard cuts. It bans the hold the peak needs, and the audience is family on phones.

The grammar forbids visible sequence (no chapter numbers or progress readouts), hard cuts between grounds, tool-like chrome, and more than one entry point.

**Navigation:** *authored:* no bar. It's a two-minute invitation read once on a phone, and a fixed bar would cover a tenth of a small screen over the art. The grammar's default is a minimal bar with one call to action. Say if you'd rather have a small fixed "Tell us you're coming".

### Signature move: butterflies come out of your finger

Tap anywhere that isn't a button and two paper butterflies flutter out from under your fingertip and rise away; garden butterflies nearby dart off; scroll fast and they flap harder. The ones you release stay with you, a small flock (at most six) drifting at the screen's edge as you read on. At the end they settle around **Tell us you're coming**. That is a trace of the guest's own journey (`feel.md` §4), and it lives on this site alone.

- Touch first: it works on phones, where every guest is; a mouse click does the same.
- Reduced motion: nothing flies; at the end a few still butterflies sit by the button.
- Built in page code with GSAP (sprites moved by transform only; never more than eight on screen). The scroll-craft engine stays unedited.

**"It's the site where…"** *butterflies fly out of your finger and follow you all the way to the party.*

### Fingerprint gate

First build in this workspace, so the registry is empty and the gate passes by construction. The row is recorded after launch.

### Feeling curve

Written before the acts. One line per act: the feeling, then what on screen causes it.

| Act | Feeling | What causes it |
|---|---|---|
| 1 | **Wonder** | The dawn garden opens around her name in layers moving at different depths; the headline builds itself line by line |
| 2 | **Tenderness**, ending in a **hush** | A year ago: paper pictures of her as a baby (the no-teeth smile, the serious stare, the babbled stories, the finger heart) arrive one by one as you read. Then the light goes: the page darkens to dusk and one line, "Lately, something has been changing…" |
| 3 | **Awe** (the peak) | Night. One chrysalis hangs still (authored silence), then cracks under your thumb; a paper butterfly climbs out with crumpled wings that smooth and open wide; gold light; she appears with her wings and a big gold 2 |
| 4 | **Clarity** | When, where, what to wear, typeset plainly on the night sky: easy to read, easy to act on |
| 5 | **Warmth** | Evening in the garden, the light of party time. "We've saved a spot for you." The butterflies that followed you settle around the button |

Adjacent acts never share a feeling. The peak has quiet in front of it (the hush and the still chrysalis).

**Authored silence** (for the checks): the end of act 2 and the first part of act 3, where only the dusk and the chrysalis's glow change.

**The peak, as a guest would tell it:** *"the chrysalis cracked open under my thumb, a paper butterfly unfolded, and then there was Taneira with wings and a big gold 2."*

**Day into night, one direction:** the page runs from dawn to evening, the time of the party (6 to 8 PM). Grounds drift one way, lilac dawn → paper → dusk → night → evening violet, so it never jumps from dark back to light (`devices.md` §10). That means the details now sit on the night sky, not white paper.

### Score

| Act | Device | Span | Why this one |
|---|---|---|---|
| 1 Wonder | `pin` + `parallax` (5 planes) + `kinetic` headline, greeting on screen at first paint | ~1.8 screens | The garden's depth playing under the thumb is the strongest open we have without video. Every plane moves **up** at its own speed; adjacent planes differ by 10 to 30%, at most ~200 px of travel (`devices.md` §6) |
| 2 Tenderness → hush | `flow` + `in` (normal scroll, exactly with your thumb), gentle `parallax` on the pictures, `drift` to dusk at the end | ~2.5 screens of content | Memories are read at reading pace, and text should move 1:1 with the thumb. This is where the apple.com feel lives |
| 3 Awe | `scrub` of a frame sequence (Codex-rendered, $0) + `reveal` (iris) to her portrait + `kinetic` "She's got her wings!" + the gold burst | **~3.4 screens, the largest** | The peak gets the best asset, the quiet before it, and the most scroll. One act, so the chrysalis appears exactly once |
| 4 Clarity | `flow` + `in` | ~1.3 screens | Logistics are information, not experience: short, plain, fast (`feel.md` §5) |
| 5 Warmth | `pin` + the signature flock settling | ~1.2 screens | The close resolves and holds: the last screen keeps its words and the button. Nothing fades out |

Checks against scroll-craft's rules:

- Device families: pin, parallax, kinetic, flow/in, drift, scrub, reveal: 7, at least 4 needed. No device twice in a row (the two `flow` acts are separated by the peak).
- One `scrub` act (at most 2 allowed).
- The peak has the largest span by a visible margin (3.4 against 1.8), and the act before it is quieter.
- About 10 screens in total, inside the 8 to 14 guideline. No filler.
- Copy anchors vary: centred title in act 1, left-aligned reading column in act 2, bottom-centre in act 3, left-aligned details in act 4, centred close.
- At most one line-by-line headline per act.

### The peak's moving picture

A **frame sequence**, not a video: about 60 to 90 portrait WebP frames drawn on a canvas by the engine's `data-sc-sequence`. That's what apple.com uses, and unlike video it can't freeze on an iPhone in Low Power Mode, the reason `PLAN.md` ruled video out.

The frames are made at $0:

1. Codex draws in-between paper stages from `butterfly-a` and the chrysalis: the shell cracking, wings crumpled, half open.
2. A Codex-written renderer animates between them, as in the lab test of 2026-10-22.
3. The CSS fold prototype and the `-back` images are retired.

### Layer contract, act 1 (the garden)

| Plane | Asset | Movement | Rule |
|---|---|---|---|
| Far | sky | barely moves | — |
| Mid | hills | slow | — |
| Framing | wisteria (top) | moves up faster than the hills | never covers the headline at rest |
| Near | meadow | faster | solid below its outline, so nothing shows through |
| Nearest | blossoms | fastest; rises past the meadow | the overtaking is the move |
| Type | headline | rides the stage | readable from the first frame; the checks measure contrast on the real frame (today it drops to 1.32:1 over the wisteria) |

### Taste floor: what changes from `main`

- Removed: the "Scroll ↓" hint, emoji used as icons, the identical cards (moments and details), centred text everywhere.
- Headlines balanced (`text-wrap: balance`), so no stray "us" on its own line; one step smaller on phones.
- Six colour roles and one accent per ground: gold on dark grounds, violet on light ones.
- Two typefaces (Fredoka for display, Nunito for text), as now.

## Mechanism

- **scroll-craft's engine, unedited** (`site/js/scrollcraft.js`, `site/css/scrollcraft.css`), for pinning (native sticky, no JS pin), parallax, cues, line-by-line headlines, wipes, ground drift, reveals on entry and the frame sequence.
- **GSAP 3.15.0** (the latest release, already vendored) for our own moments only: the peak's portrait and gold 2, the burst, and the signature butterflies. It is scrubbed by the same act the engine measures; the lab measured them agreeing to within 0.03%.
- The lab test (2026-10-22, 4× slower CPU, iPhone-sized): zero long tasks and zero slow frames for both engine + GSAP and GSAP only. The engine does more style work (about 107 ms against 24 ms over a whole scroll); to be confirmed on your phones.

## How it gets checked

- scroll-craft's `shoot.mjs` at phone, desktop and reduced motion. It reports scroll where nothing changes, text that never reaches full strength, and contrast on the actual frame. It ran on this Mac in the lab.
- Our checks, reworked for real sections instead of one timeline: layout audit (overlaps, text off screen, tap targets, sideways scroll), flicker under memory pressure, CPU-slowed long tasks.
- Then the **feel check** (`feel.md` §6): scroll it cold, write one word per act, compare with the feeling curve above, and fix the page where they differ.
- Then your phones. A green run says nothing about a real iPhone.

## Build order

Each step is its own branch, compared on your phone and merged only when you say so.

1. **The new skeleton with today's art:** engine plus GSAP, the five acts, the taste-floor fixes, real scrolling. You judge the scroll feel before any new art is made.
2. **The peak:** Codex in-between drawings, the rendered frame sequence, the portrait reveal.
3. **Year one:** baby drawing sheet from `b1`–`b6` first (for your approval), then the four pictures and a paper caterpillar.
4. **The details on the night sky, and the evening close.**
5. **The signature butterflies.**
6. Then milestones 3 to 6 from `PROGRESS.md` (desktop art, weight budget, invitation features, PWA, launch).
