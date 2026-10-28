import assert from "node:assert/strict";
import {test} from "node:test";
import {print} from "graphql";
import {metadataDocument, newBlocksDocument, watchBlocks} from "../examples/live.mjs";

test("query documents parse once per shape and keep values in variables", () => {
  const first = metadataDocument();
  assert.equal(first.document.definitions[0].operation, "query");
  assert.match(print(first.document), /metadata\s*\{\s*chainId\s*\}/);
  assert.equal(metadataDocument().document, first.document);
  const live = newBlocksDocument({chainId: {eq: 1}});
  assert.match(print(live.document), /subscription \(\$v1: BlockFilterInput\)/);
  assert.deepEqual(Object.values(live.variables), [{chainId: {eq: 1}}]);
  assert.equal(newBlocksDocument({chainId: {eq: 2}}).document, live.document);
});

test("watchBlocks streams typed payloads through a graphql-ws client", () => {
  const seen = [], errors = [];
  let unsubscribed = false;
  const ws = {
    subscribe(payload, sink) {
      assert.match(payload.query, /^subscription .*newBlocks\(criteria:\$v1\)/);
      assert.deepEqual(Object.values(payload.variables), [null]);
      sink.next({data: {newBlocks: {number: "7"}}});
      sink.next({errors: [{message: "denied"}]});
      sink.error(new Error("closed"));
      return () => { unsubscribed = true; };
    },
  };
  const stop = watchBlocks(ws, null, b => seen.push(b), e => errors.push(e));
  stop();
  assert.deepEqual(seen, [{number: "7"}]);
  assert.equal(errors.length, 2);
  assert.ok(unsubscribed);
});
