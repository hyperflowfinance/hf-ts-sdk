import {parse, type DocumentNode} from "graphql";
import {
  generateMutationOp, generateQueryOp, generateSubscriptionOp,
  type MutationGenqlSelection, type MutationResult,
  type QueryGenqlSelection, type QueryResult,
  type SubscriptionGenqlSelection, type SubscriptionResult,
} from "./generated";

/** Structurally identical to `TypedDocumentNode` (Apollo, urql, graphql-request). */
export type TypedDocument<R, V = Record<string, unknown>> =
  DocumentNode & {__apiType?: (variables: V) => R};
export interface Operation<R> {
  document: TypedDocument<R>;
  variables: Record<string, unknown>;
}

// ponytail: unbounded cache; keys are query shapes (values live in variables), so it stays small.
const parsed = new Map<string, DocumentNode>();

function toOperation<R>({query, variables}: {query: string; variables?: Record<string, unknown>}) {
  let document = parsed.get(query);
  if (!document) parsed.set(query, document = parse(query));
  return {document, variables: variables ?? {}} as Operation<R>;
}

export const queryDocument = <R extends QueryGenqlSelection>(fields: R & {__name?: string}) =>
  toOperation<QueryResult<R>>(generateQueryOp(fields));

export const mutationDocument = <R extends MutationGenqlSelection>(fields: R & {__name?: string}) =>
  toOperation<MutationResult<R>>(generateMutationOp(fields));

export const subscriptionDocument = <R extends SubscriptionGenqlSelection>(
  fields: R & {__name?: string},
) => toOperation<SubscriptionResult<R>>(generateSubscriptionOp(fields));
