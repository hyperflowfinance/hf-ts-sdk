import assert from "node:assert/strict";
import {test} from "node:test";
import {parse, print} from "graphql";
import {connect, generateAliasedQueryOp} from "@hyperflowlabs/hf-ts-sdk";

const wallet = "0xabc";
const page = (direction) => ({transactions: {
  __args: {input: {filters: {[direction]: {eq: wallet}}, pagination: {limit: 2}}},
  items: {hash: true, blockNumber: true},
}});

test("queryAliased sends both directions in one request and keys data by alias", async () => {
  let calls = 0;
  const client = connect({
    url: "https://example.test/graphql", authValue: "key",
    fetch: async (url, options) => {
      calls++;
      assert.equal(options.headers["x-api-key"], "key");
      const {query, variables} = JSON.parse(options.body);
      assert.match(query, /^query FirstMap\(\$out_v1:TransactionQueryInput,\$in_v1:TransactionQueryInput\)/);
      assert.match(query, /out:transactions\(input:\$out_v1\).*in:transactions\(input:\$in_v1\)/);
      assert.deepEqual(variables.out_v1.filters, {fromAddress: {eq: wallet}});
      assert.deepEqual(variables.in_v1.filters, {toAddress: {eq: wallet}});
      return Response.json({data: {out: {items: [{hash: "0x1"}]}, in: {items: []}}});
    },
  });
  const data = await client.queryAliased({out: page("fromAddress"), in: page("toAddress")}, "FirstMap");
  assert.equal(calls, 1);
  assert.deepEqual(data, {out: {items: [{hash: "0x1"}]}, in: {items: []}});
});

test("aliased operations are valid GraphQL with per-alias fragments", () => {
  const scalars = {transactions: {items: {__scalar: true}}};
  const {query, variables} = generateAliasedQueryOp({a: scalars, b: {erc20TokenTransfers: {items: {__scalar: true}}}});
  const printed = print(parse(query));
  assert.match(printed, /a: transactions \{\s*items \{\s*\.\.\.a_f1/);
  assert.match(printed, /fragment a_f1 on Transaction/);
  assert.match(printed, /fragment b_f1 on ERC20TokenTransfer/);
  assert.deepEqual(variables, {});
});

test("aliased operations reject invalid aliases and multi-field selections", () => {
  assert.throws(() => generateAliasedQueryOp({"bad-alias": page("fromAddress")}), /invalid alias/);
  assert.throws(() => generateAliasedQueryOp({x: {...page("fromAddress"), metadata: {chainId: true}}}),
    /exactly one root field/);
  assert.throws(() => generateAliasedQueryOp({}), /at least one alias/);
  assert.throws(() => generateAliasedQueryOp({x: page("fromAddress")}, "no spaces"), /operation name/);
});
