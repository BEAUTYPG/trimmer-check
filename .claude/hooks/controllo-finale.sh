#!/bin/bash
# Hook "Stop": se sono stati toccati file TypeScript esegue il controllo dei tipi
# (tsc) e rimanda gli errori a Claude prima di chiudere il lavoro.
INPUT=$(cat)
echo "$INPUT" | grep -q '"stop_hook_active": *true' && exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
git status --porcelain | grep -qE '\.(ts|tsx)$' || exit 0
[ -x node_modules/.bin/tsc ] || exit 0
OUT=$(node_modules/.bin/tsc --noEmit 2>&1)
if [ $? -ne 0 ]; then echo "Controllo dei tipi fallito: correggi prima di chiudere." >&2; echo "$OUT" | tail -40 >&2; exit 2; fi
exit 0
