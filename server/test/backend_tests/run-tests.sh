#!/usr/bin/env bash
# run-tests.sh — run server Jest tests in bash (Git Bash / WSL)
# Usage: ./run-tests.sh            # runs all tests
#        ./run-tests.sh <args>     # passes args to jest

set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"
export RUN_INTEGRATION=false

JEST_BIN="$HERE/node_modules/jest/bin/jest.js"
if [ ! -f "$JEST_BIN" ]; then
  echo "Jest binary not found at $JEST_BIN — please run npm install first." >&2
  exit 1
fi

if [ "$#" -gt 0 ]; then
  node "$JEST_BIN" --runInBand "$@"
else
  node "$JEST_BIN" --runInBand
fi
