#!/usr/bin/env bash
# Generate one image with Codex's built-in image tool (ChatGPT plan, no API key).
# Usage: tools/gen.sh <prompt-name> <out-name> [reference images, in prompt order...]
# Reads art/prompts/<prompt-name>.txt, prepends the style paragraph from art/STYLE.md,
# writes art/raw/<out-name>.png and art/raw/<out-name>.log.
set -euo pipefail
cd "$(dirname "$0")/.."
prompt_name=$1 out=$2; shift 2

style=$(sed -n 's/^> //p' art/STYLE.md)
refs=()
for f in "$@"; do refs+=(-i "$(realpath "$f")"); done

mkdir -p art/raw
command codex exec -C "$(realpath art/raw)" -s workspace-write --skip-git-repo-check \
  -c model_reasoning_effort=low \
  "Use the image generation tool (\$imagegen) exactly once. Pass it this prompt verbatim:

$style

$(cat "art/prompts/$prompt_name.txt")

Then copy the generated PNG, unmodified, to ./$out.png and do nothing else." \
  ${refs[@]+"${refs[@]}"} < /dev/null > "art/raw/$out.log" 2>&1 || true

if [ -f "art/raw/$out.png" ]; then echo "$out ok"; else echo "$out FAILED, see art/raw/$out.log"; exit 1; fi
