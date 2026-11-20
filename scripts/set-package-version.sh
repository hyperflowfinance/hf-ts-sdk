#!/usr/bin/env bash
set -euo pipefail
if [[ "$GITHUB_EVENT_NAME" == workflow_dispatch ]]; then
  version="${PREVIEW_VERSION:?}"
  [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+-stage\.[0-9]+\.g[0-9a-f]{64}$ ]]
else
  version="${GITHUB_REF_NAME#v}"
  [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+([+-].+)?$ ]]
fi
npm version "$version" --no-git-tag-version
