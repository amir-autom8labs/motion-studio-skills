#!/usr/bin/env bash
# One reel, one look: re-renders five scenes in the same look (default: bold), crossfades them and lays
# a single continuous soundtrack over the whole thing.   bash build.sh [look]
set -euo pipefail
cd "$(dirname "$0")"
M="node ../../toolkit/motion.mjs"; OUT=../out; LOOK="${1:-bold}"; TMP="$OUT/.reel-$LOOK"; XFADE=0.5
mkdir -p "$TMP"
SCENES=(01-anime-launch-title/scene.js 02-react-spring-ui/scene.jsx 06-d3-data-story/scene.js 05-matter-physics/scene.js 03-pixi-particles/scene.js)
CLIPS=()
for s in "${SCENES[@]}"; do
  clip="$TMP/$(dirname "$s").mp4"; CLIPS+=("$clip")
  [ -f "$clip" ] || $M render "../$s" --set look="$LOOK" --no-audio -o "$clip"
done
# reel length = sum(clip durations) - crossfades
LEN=$(for c in "${CLIPS[@]}"; do ffprobe -v error -show_entries format=duration -of csv=p=0 "$c"; done | awk -v x=$XFADE '{s+=$1} END {printf "%.2f", s-(NR-1)*x}')
$M render soundtrack.js -o "$TMP/soundtrack.wav" --duration "$LEN"
$M concat "${CLIPS[@]}" --xfade $XFADE --audio "$TMP/soundtrack.wav" -o "$OUT/09-launch-reel.mp4" --crf 20
$M check "$OUT/09-launch-reel.mp4"
