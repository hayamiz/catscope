#!/bin/sh
# Regenerate binary example assets.
# Prerequisites: ImageMagick (convert), ffmpeg, pandoc (optional for PDF/HTML)
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Generating images ==="
cd images
convert -size 100x100 gradient:'#667eea'-'#764ba2' \
  -fill 'rgba(255,255,255,0.5)' -draw 'circle 50,50 50,25' sample.jpg
convert -size 100x100 gradient:'#f093fb'-'#f5576c' \
  -fill 'rgba(255,255,255,0.3)' -draw 'polygon 50,10 90,90 10,90' sample.png
convert -size 100x100 -delay 30 \
  \( xc:none -fill '#E91E63' -draw 'circle 50,50 50,20' \) \
  \( xc:none -fill '#2196F3' -draw 'circle 50,50 50,20' \) \
  \( xc:none -fill '#4CAF50' -draw 'circle 50,50 50,20' \) \
  -loop 0 sample.gif
convert -size 100x100 gradient:'#43e97b'-'#38f9d7' \
  -fill 'rgba(0,0,0,0.2)' -draw 'circle 30,30 30,15' \
  -fill 'rgba(255,255,255,0.3)' -draw 'rectangle 55,55 85,85' sample.webp
echo "  Images done"

echo "=== Generating videos ==="
cd "$SCRIPT_DIR/video"
ffmpeg -y -f lavfi -i "smptebars=size=320x240:rate=10:duration=2" \
  -c:v libx264 -preset ultrafast -crf 30 -pix_fmt yuv420p -movflags +faststart sample.mp4 2>/dev/null
ffmpeg -y -f lavfi -i "smptebars=size=320x240:rate=10:duration=2" \
  -c:v libvpx-vp9 -crf 40 -b:v 0 -pix_fmt yuv420p sample.webm 2>/dev/null
ffmpeg -y -f lavfi -i "smptebars=size=320x240:rate=10:duration=2" \
  -c:v mjpeg -q:v 15 -pix_fmt yuvj420p sample.avi 2>/dev/null
ffmpeg -y -f lavfi -i "smptebars=size=320x240:rate=10:duration=2" \
  -c:v libx264 -preset ultrafast -crf 30 -pix_fmt yuv420p sample.mov 2>/dev/null
echo "  Videos done"

echo "=== Generating edge-case files ==="
cd "$SCRIPT_DIR/edge-cases"
python3 -c "
for i in range(20000):
    print(f'Line {i+1:05d}: The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet.')
" > large-file.txt
dd if=/dev/urandom bs=256 count=1 of=binary-file.bin 2>/dev/null
echo "  Edge cases done"

if command -v pandoc >/dev/null 2>&1; then
  echo "=== Generating documents ==="
  cd "$SCRIPT_DIR/documents"
  pandoc "$SCRIPT_DIR/../README.md" -o sample.html --standalone --from=gfm 2>/dev/null || echo "  HTML generation failed"
  if command -v weasyprint >/dev/null 2>&1; then
    pandoc "$SCRIPT_DIR/../README.md" -o sample.pdf --pdf-engine=weasyprint 2>/dev/null || echo "  PDF generation failed"
  else
    echo "  Skipping PDF (weasyprint not installed)"
  fi
else
  echo "=== Skipping documents (pandoc not installed) ==="
fi

echo "Done."
