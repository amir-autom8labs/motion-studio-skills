#!/usr/bin/env bash
# Re-renders every committed demo output. Takes roughly ten minutes on 4 cores.
set -uo pipefail
cd "$(dirname "$0")"; M="node ../toolkit/motion.mjs"; O=out
for s in 01-anime-launch-title/scene.js 02-react-spring-ui/scene.jsx 03-pixi-particles/scene.js 04-p5-generative/scene.js 05-matter-physics/scene.js 06-d3-data-story/scene.js 07-tone-audio-reactive/scene.js 10-three-product-spin/scene.js 12-glb-model/scene.js; do
  $M render $s -o $O/$(dirname $s).mp4
done
$M render 02-react-spring-ui/scene.jsx --preset portrait -o $O/02-react-spring-ui.portrait.mp4
$M render 06-d3-data-story/scene.js --preset portrait -o $O/06-d3-data-story.portrait.mp4
$M render 02-react-spring-ui/scene.jsx --preset hd --from 0 --to 5 -o $O/02-react-spring-ui.gif
$M render 08-alpha-lower-third/scene.js --transparent -o $O/08-alpha-lower-third.mov
ffmpeg -v error -y -i $O/04-p5-generative.mp4 -i $O/08-alpha-lower-third.mov -filter_complex "[0][1]overlay=shortest=1" -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart $O/08-overlay-on-plate.mp4
bash 09-launch-reel/build.sh bold
for f in $O/[01]*.mp4; do d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f"); ffmpeg -v error -y -i "$f" -vf "fps=8/$d,scale=-2:360,tile=4x2:padding=6:margin=6:color=0x202020" -frames:v 1 -update 1 "$O/sheets/$(basename ${f%.mp4}).png"; done
echo ALL-DONE
