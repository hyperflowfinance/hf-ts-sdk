import assert from "node:assert/strict";
import {beforeEach, test} from "node:test";
import {createRequire} from "node:module";
import {connect, createClient, GenqlError} from "@hyperflowlabs/hf-ts-sdk";
import {getMetadata} from "../examples/metadata.mjs";
const data = {metadata: {chainId: "1"}};

beforeEach(t => {
  const saved = {...process.env};
  t.after(() => { process.env = saved; });
  for (const name of ["HYPERFLOW_API_URL", "HYPERFLOW_AUTH_HEADER", "HYPERFLOW_AUTH_VALUE"]) {
    delete process.env[name];
  }
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Live API requests are forbidden in tests");
  });
});

test("built package works through CommonJS and ESM", async () => {
  const cjs = createRequire(import.meta.url)("@hyperflowlabs/hf-ts-sdk");
  assert.equal(cjs.connect, connect);
  assert.equal(typeof createClient, "function");
});

test("example sends explicit auth and headers through a custom fetch", async () => {
  process.env.HYPERFLOW_AUTH_HEADER = "X-Env-Key";
  const metadata = await getMetadata({
    url: "https://example.test/graphql", authHeader: "X-Custom-Key", authValue: "test",
    headers: new Headers({"X-Custom": "kept"}),
    fetch: async (url, options) => {
      assert.equal(url, "https://example.test/graphql");
      assert.equal(options.method, "POST");
      assert.equal(options.headers["x-custom-key"], "test");
      assert.equal(options.headers["x-env-key"], undefined);
      assert.equal(options.headers["x-custom"], "kept");
      assert.match(JSON.parse(options.body).query, /metadata\s*\{\s*chainId\s*\}/);
      return Response.json({data});
    },
  });
  assert.deepEqual(metadata, data.metadata);
});

test("example uses environment defaults and async headers on every request", async () => {
  process.env.HYPERFLOW_API_URL = "https://env.test/graphql";
  process.env.HYPERFLOW_AUTH_HEADER = "X-Env-Key";
  process.env.HYPERFLOW_AUTH_VALUE = "env-test";
  let calls = 0;
  const options = {
    headers: async () => [["X-Request", String(++calls)]],
    fetch: async (url, options) => {
      assert.equal(url, process.env.HYPERFLOW_API_URL);
      assert.equal(options.headers["x-env-key"], "env-test");
      assert.equal(options.headers["x-request"], String(calls));
      return Response.json({data});
    },
  };
  await getMetadata(options);
  await getMetadata(options);
  assert.equal(calls, 2);
});

test("example defaults auth to x-api-key and can disable environment auth", async () => {
  process.env.HYPERFLOW_AUTH_VALUE = "must-not-send";
  for (const authValue of [undefined, "test", ""]) await getMetadata({
    authValue,
    fetch: async (url, options) => {
      assert.equal(url, "https://api.hyperflowlabs.com/graphql");
      assert.equal(options.headers["x-api-key"], (authValue ?? "must-not-send") || undefined);
      assert.equal(options.headers.authorization, undefined);
      return Response.json({data});
    },
  });
});

test("example propagates HTTP, network and GraphQL failures", async () => {
  await assert.rejects(getMetadata({
    fetch: async () => new Response("limited", {status: 429, statusText: "Too Many Requests"}),
  }), /limited/);
  await assert.rejects(getMetadata({
    fetch: async () => { throw new Error("offline"); },
  }), /offline/);
  await assert.rejects(getMetadata({
    fetch: async () => Response.json({errors: [{message: "denied"}]}),
  }), GenqlError);
});
