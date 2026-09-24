#!/usr/bin/env bash
# Builds the whole site into _site/, ready to publish. Used by Cloudflare
# Pages (build command: bash ci-build.sh, output folder: _site) and by the
# GitHub Action. Same steps you'd run by hand, see Guides/raj-cassette-website.md.
set -euo pipefail

pip install "pillow>=10,<12"
python build.py --no-serve
npx -y tailwindcss@3.4.17 -i src/input.css -o style.css --minify

rm -rf _site
mkdir _site
cp *.html style.css robots.txt sitemap.xml llms.txt _headers favicon.ico favicon.png _site/
cp -r img fonts _site/
find _site -name '*LOCAL-ONLY*' -delete
echo "built into _site/"
