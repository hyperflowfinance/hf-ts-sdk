# hf-ts-sdk

Typed TypeScript client for the HyperFlow GraphQL API, following
[hf-py-sdk](https://github.com/hyperflowfinance/hf-py-sdk).
Node.js 22+ and browsers with native fetch; no runtime dependencies.

## Install and use

After the first release:

```sh
npm install @hyperflowlabs/hf-ts-sdk
```

```ts
import {connect} from "@hyperflowlabs/hf-ts-sdk";

const client = connect();
const data = await client.query({metadata: {chainId: true}});
console.log(data.metadata);
```

Queries and mutations use [Genql](https://genql.dev/docs) selection objects.
Custom scalars are `unknown`: narrow them before using their wire values.
CommonJS `require("@hyperflowlabs/hf-ts-sdk")` is supported too. Browser bundlers can consume
the CommonJS package; no Node-only APIs are used by the runtime.

| Option | Environment variable | Default |
| --- | --- | --- |
| `url` | `HYPERFLOW_API_URL` | `https://api.hyperflowlabs.com/graphql` |
| `authHeader` | `HYPERFLOW_AUTH_HEADER` | `x-api-key` |
| `authValue` | `HYPERFLOW_AUTH_VALUE` | no auth |

Explicit options override environment variables; `authValue: ""` disables
environment auth. Browsers use explicit options. `headers` accepts native
Headers, tuples, objects, or an async callback, resolved on every request.
`fetch` accepts a custom implementation. HTTP/network/GraphQL errors reject.
The generated `createClient` and schema types are also exported.

## Runnable example

After building, run `node examples/metadata.mjs` from this checkout.
Set `HYPERFLOW_AUTH_VALUE` for authenticated requests; the default header is
`x-api-key`. The example exports `getMetadata(options)` for reuse.
Tests execute this exact example with mocked fetch responses, never the live API:

```sh
npm test
```

## Generate and check (Docker)

```sh
docker run --rm -v "${PWD}:/sdk" -w /sdk node:24-alpine sh -c \
  'npm install --ignore-scripts && mkdir -p artifacts && npm pack --pack-destination artifacts'
```

Pinned Genql 6.3.4 generates from live introspection on every build.
`src/generated/`, `dist/`, and tarballs are gitignored, not committed.
Only hand-written sources, generator, tests, docs and workflows are tracked.
The package allowlist ships compiled JS and declarations, README and license.
The public endpoint needs no key; HTTP 429 fails explicitly, without retry loops.
The generator accepts the same environment variables as the client.

CI generates once, uploads the tarball, then installs and tests it (including
TypeScript declarations) on Node 22 and 24. It does not test an unbuilt source tree.
Only schema generation uses the live API; example tests forbid real fetch calls.

## npm continuous deployment

Only pushing an explicitly authorized `v<semver>` tag publishes.
The release workflow derives the version from the tag, generates, builds and
tests once, then publishes that exact tested tarball with OIDC provenance.
Keep the tarball path prefixed with `./` so npm treats it as a local file.
Create release tags from approved `main`, after all intended changes are merged.
Prerelease tags publish under npm's `next` dist-tag; stable releases use `latest`.
The manifest's `0.0.0-development` is only a non-release placeholder.

Configure npm's trusted publisher for package `@hyperflowlabs/hf-ts-sdk`:

- GitHub owner: `hyperflowfinance`
- Repository: `hf-ts-sdk`
- Workflow filename: `release.yml`
- GitHub environment: `npm`

The GitHub environment is created separately; npm account/package ownership and
trusted-publisher setup must be completed by an npm maintainer before releasing.
If npm requires an initial package before enabling trust, arrange its bootstrap
with the maintainer; do not add npm tokens or publish from a laptop.
Require 2FA and disallow token publishing after OIDC is configured.
Never commit credentials. No release tag is created by repository setup.
