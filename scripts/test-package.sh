#!/usr/bin/env bash
set -euo pipefail
mkdir package-test
cp -r tests examples package-test/
cd package-test
npm init --yes
npm install --ignore-scripts --no-package-lock ../artifacts/*.tgz graphql@16.11.0 typescript@5.9.3
node --test tests/*.test.mjs
npx tsc --strict --noEmit --target ES2022 --module Node16 --moduleResolution Node16 tests/types.ts
