#!/bin/sh
# Git merge driver: regenerate assets/tailwind.css from source after a merge.
# Configure once per clone: npm run setup:git
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT" || exit 1
npm run build:css || exit 1
cp "$ROOT/assets/tailwind.css" "$2"
exit 0
