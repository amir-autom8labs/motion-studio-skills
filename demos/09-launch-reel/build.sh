#!/usr/bin/env bash
# Assembles the individual demo clips into one launch reel with a single continuous soundtrack.
set -euo pipefail
cd "$(dirname "$0")"
M="node ../../toolkit/motion.mjs"; OUT=../out
CLIPS=("$OUT/01-anime-launch-title.mp4" "$OUT/02-react-spring-ui.mp4" "$OUT/06-d3-data-story.mp4" "$OUT/05-matter-physics.mp4" "$OUT/03-pixi-particles.mp4")
XFADE=0.5
# reel length = sum(clip durations) - crossfades
LEN=$(for c in "${CLIPS[@]}"; do ffprobe -v error -show_entries format=duration -of csv=p=0 "$c"; done | awk -v x=$XFADE '{s+=$1} END {printf "%.2f", s-(NR-1)*x}')
$M render soundtrack.js -o "$OUT/reel-soundtrack.wav" --duration "$LEN"
$M concat "${CLIPS[@]}" --xfade $XFADE --audio "$OUT/reel-soundtrack.wav" -o "$OUT/09-launch-reel.mp4" --crf 20
