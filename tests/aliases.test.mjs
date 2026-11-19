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

test("first-map shape: native and ERC-20 Transfer logs both ways, filters only in variables", () => {
  const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  const topic = "0x" + "0".repeat(24) + wallet.slice(2);
  const window = {chainId: {gte: 1, lte: 1}, blockNumber: {lte: 99}};
  const desc = {orderBy: {field: "BLOCK_NUMBER", direction: "DESC"}, pagination: {limit: 500}};
  const tx = dir => ({transactions: {__args: {input: {filters: {...window, [dir]: {eq: wallet}}, ...desc}},
    items: {hash: true}}});
  const erc = t => ({logs: {__args: {input: {filters: {...window, topic0: {eq: TRANSFER}, [t]: {eq: topic}}, ...desc}},
    items: {txHash: true, logIndex: true, address: true, data: true}}});
  const {query, variables} = generateAliasedQueryOp(
    {txOut: tx("fromAddress"), txIn: tx("toAddress"), ercOut: erc("topic1"), ercIn: erc("topic2")}, "FirstMap");
  const printed = print(parse(query));
  assert.match(printed, /ercOut_v1: LogQueryInput/);
  for (const alias of ["txOut", "txIn", "ercOut", "ercIn"]) assert.match(printed, new RegExp(`${alias}: `));
  assert.doesNotMatch(query, /0x/, "addresses and topics must stay out of the query text");
  assert.deepEqual(variables.ercIn_v1.filters, {...window, topic0: {eq: TRANSFER}, topic2: {eq: topic}});
  assert.deepEqual(variables.txOut_v1.orderBy, desc.orderBy);
  assert.equal(Object.keys(variables).length, 4);
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
