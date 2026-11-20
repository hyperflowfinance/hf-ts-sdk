#!/usr/bin/env bash
set -euo pipefail
if [[ "$GITHUB_EVENT_NAME" == workflow_dispatch ]]; then
  version="${PREVIEW_VERSION:?}"
  tag=stage
else
  version="${GITHUB_REF_NAME#v}"
  tag=latest
  if [[ "$version" == *-* ]]; then tag=next; fi
fi
if [[ "$tag" == stage ]]; then
  status=$(curl -sS -o /dev/null -w '%{http_code}' "https://registry.npmjs.org/@hyperflowlabs%2fhf-ts-sdk/$version")
  case "$status" in 404) ;; 200) exit 0 ;; *) echo "Unexpected npm status $status"; exit 1 ;; esac
fi
npm publish ./artifacts/*.tgz --access public --provenance --tag "$tag"
