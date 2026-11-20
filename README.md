# hf-ts-sdk

Typed TypeScript client for the HyperFlow GraphQL API, following
[hf-py-sdk](https://github.com/hyperflowfinance/hf-py-sdk). Supports Node.js 22+ and browsers with native fetch; no runtime dependencies.

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

Queries and mutations use [Genql](https://genql.dev/docs) selection objects. Genql has no alias syntax;
`client.queryAliased({alias: {rootField: {...}}}, name?)` sends several root fields (even the same field twice) in one request and returns data keyed by alias. `generateAliasedQueryOp` returns raw `{query, variables}`.

```ts
const page = (dir: "fromAddress" | "toAddress") => ({transactions: {
  __args: {input: {filters: {chainId: {gte: 1, lte: 1}, [dir]: {eq: wallet}}}},
  items: {hash: true, fromAddress: true, toAddress: true},
}});
const {out, in: incoming} = await client.queryAliased({out: page("fromAddress"), in: page("toAddress")});
```
`BigInt`/`DateTime` are `string`; other custom scalars are `unknown`: narrow them. CommonJS `require("@hyperflowlabs/hf-ts-sdk")` is supported;
browser bundlers can consume the package, and the runtime uses no Node-only APIs.

| Option | Environment variable | Default |
| --- | --- | --- |
| `url` | `HYPERFLOW_API_URL` | `https://api.hyperflowlabs.com/graphql` |
| `authHeader` | `HYPERFLOW_AUTH_HEADER` | `x-api-key` |
| `authValue` | `HYPERFLOW_AUTH_VALUE` | no auth |

Explicit options override environment variables; `authValue: ""` disables environment auth. Browsers use explicit options.
`headers` accepts native Headers, tuples, objects, or an async callback, resolved per request; `fetch` accepts a custom implementation. HTTP/network/GraphQL errors reject. Generated `createClient` and schema types are exported.

## Subscriptions and Apollo

`subscribe(ws, selection, sink)` runs a typed subscription on any graphql-ws client and returns its unsubscribe.
`@hyperflowlabs/hf-ts-sdk/document` exports query/mutation/subscription document helpers for Apollo, urql, etc. (`graphql` v16 optional peer); `toDocument<Result>(op)` parses a generated operation into a typed document (pass `op.variables` separately). See `examples/live.mjs`.

## Runnable example
After building, run `node examples/metadata.mjs`; set `HYPERFLOW_AUTH_VALUE` for authenticated requests (default header `x-api-key`). The example exports `getMetadata(options)` for reuse.
Tests execute it with mocked fetch responses, never the live API:

```sh
npm test
```

## Generate and check (Docker)

```sh
docker run --rm -v "${PWD}:/sdk" -w /sdk node:24-alpine sh -c \
  'npm install --ignore-scripts && mkdir -p artifacts && npm pack --pack-destination artifacts'
```

Pinned Genql 6.3.4 generates from live introspection or a verified stage snapshot. `src/generated/`, `dist/` and tarballs are gitignored; only sources, generator, tests, docs and workflows are tracked.
The package allowlist ships compiled JS, declarations, README and license. The public endpoint needs no key; HTTP 429 fails explicitly. The generator accepts the client's environment variables.

CI generates once, uploads the tarball, then installs and tests it (including declarations) on Node 22 and 24; it does not test an unbuilt source tree.
Only stable schema generation introspects live; example tests forbid real fetch calls.

## npm continuous deployment

Stable releases publish only on authorized `v<semver>` tags from approved `main`. The workflow derives the version, generates/builds/tests once, then publishes the tested tarball with OIDC provenance; use `./` so npm treats it as local.
Prerelease tags use npm's `next` dist-tag; stable releases use `latest`. `0.0.0-development` is only a placeholder.

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

## Stage previews

Verified immutable stage snapshots publish public previews to npm's `stage` dist-tag; install with `npm install @hyperflowlabs/hf-ts-sdk@stage`.
Preview builds default to stage; stable builds default to production. Explicit `url` and `HYPERFLOW_API_URL` settings override either.
