const assert = require("node:assert/strict");
const {test} = require("node:test");
const {connect, createClient, GenqlError} = require("hf-ts-sdk");
const query = {__typename: true};
const data = {__typename: "query_root"};

test("built package works through CommonJS and ESM", async () => {
  const esm = await import("hf-ts-sdk");
  assert.equal(esm.connect, connect);
  assert.equal(typeof createClient, "function");
});

test("defaults, typed queries and explicit auth reach a custom fetch", async () => {
  const client = connect({
    url: "https://example.test/graphql", authHeader: "X-Api-Key", authValue: "test",
    headers: new Headers({"X-Custom": "kept"}),
    fetch: async (url, options) => {
      assert.equal(url, "https://example.test/graphql");
      assert.equal(options.method, "POST");
      assert.equal(options.headers["x-api-key"], "test");
      assert.equal(options.headers["x-custom"], "kept");
      assert.match(JSON.parse(options.body).query, /__typename/);
      return Response.json({data});
    },
  });
  assert.deepEqual(await client.query(query), data);
});

test("environment defaults and async headers apply on every request", async t => {
  const saved = {...process.env};
  t.after(() => { process.env = saved; });
  process.env.HYPERFLOW_API_URL = "https://env.test/graphql";
  process.env.HYPERFLOW_AUTH_HEADER = "X-Env-Key";
  process.env.HYPERFLOW_AUTH_VALUE = "env-test";
  let calls = 0;
  const client = connect({
    headers: async () => [["X-Request", String(++calls)]],
    fetch: async (url, options) => {
      assert.equal(url, process.env.HYPERFLOW_API_URL);
      assert.equal(options.headers["x-env-key"], "env-test");
      assert.equal(options.headers["x-request"], String(calls));
      return Response.json({data});
    },
  });
  await client.query(query);
  await client.query(query);
  assert.equal(calls, 2);
});

test("canonical endpoint and explicit empty auth override environment", async t => {
  const saved = {...process.env};
  t.after(() => { process.env = saved; });
  delete process.env.HYPERFLOW_API_URL;
  process.env.HYPERFLOW_AUTH_VALUE = "must-not-send";
  await connect({
    authValue: "",
    fetch: async (url, options) => {
      assert.equal(url, "https://api.hyperflowlabs.com/graphql");
      assert.equal(options.headers.authorization, undefined);
      return Response.json({data});
    },
  }).query(query);
});

test("HTTP, network and GraphQL failures reject instead of returning success", async () => {
  await assert.rejects(connect({
    fetch: async () => new Response("limited", {status: 429, statusText: "Too Many Requests"}),
  }).query(query), /limited/);
  await assert.rejects(connect({
    fetch: async () => { throw new Error("offline"); },
  }).query(query), /offline/);
  await assert.rejects(connect({
    fetch: async () => Response.json({errors: [{message: "denied"}]}),
  }).query(query), GenqlError);
});
