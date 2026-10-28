import {subscribe} from "@hyperflowlabs/hf-ts-sdk";
import {queryDocument, subscriptionDocument} from "@hyperflowlabs/hf-ts-sdk/document";

const block = {hash: true, number: true, timestamp: true, txCount: true};

/** Apollo/urql: `const {document, variables} = metadataDocument(); useQuery(document, {variables})`. */
export const metadataDocument = () => queryDocument({metadata: {chainId: true}});

/** Apollo `useSubscription(document, {variables})` over a GraphQLWsLink. */
export const newBlocksDocument = criteria =>
  subscriptionDocument({newBlocks: {__args: {criteria}, ...block}});

/**
 * Without Apollo: `ws` is graphql-ws `createClient({url, connectionParams: {"x-api-key": key}})`.
 * Returns the unsubscribe function.
 */
export const watchBlocks = (ws, criteria, onBlock, onError = console.error) =>
  subscribe(ws, {newBlocks: {__args: {criteria}, ...block}}, {
    next: ({data, errors}) => errors?.length ? onError(errors) : onBlock(data.newBlocks),
    error: onError,
    complete: () => {},
  });
