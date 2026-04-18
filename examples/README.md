# Example Files

Sample files for manual testing and verification of catscope's file browsing and preview features.

## Structure

- `images/` - JPEG, PNG, GIF, WebP, SVG samples (ImageMagick generated)
- `documents/` - EPS sample (hand-crafted PostScript)
- `text/` - Markdown, JSON, YAML, TOML, XML, CSV, TSV, log, plain text
- `code/` - Go, Python, JavaScript, C, SQL, Makefile, Dockerfile
- `video/` - MP4, WebM, AVI, MOV (ffmpeg SMPTE color bars)
- `edge-cases/` - Hidden files, no extension, empty, Unicode filenames, large file, binary

## Regenerating Binary Assets

Run `./generate.sh` to regenerate all binary assets (images, videos, edge-case files).
Requires: ImageMagick, ffmpeg. Optional: pandoc + weasyprint for PDF/HTML.
