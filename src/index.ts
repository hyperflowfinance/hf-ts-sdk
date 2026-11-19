import {
  createClient, generateSubscriptionOp,
  type SubscriptionGenqlSelection, type SubscriptionResult,
} from "./generated";
import {createFetcher} from "./generated/runtime";
import {generateAliasedQueryOp, type AliasedResult, type AliasedSelection} from "./aliases";
export * from "./generated";
export * from "./aliases";

export interface SubscriptionSink<T> {
  next(value: {data?: T | null; errors?: readonly unknown[]}): void;
  error(error: unknown): void;
  complete(): void;
}

/** Structural graphql-ws `Client`; pass `createClient(...)` from graphql-ws. */
export interface WsClient {
  subscribe(payload: {query: string; variables?: Record<string, unknown>},
    sink: SubscriptionSink<any>): () => void;
}

/** Typed live subscription; returns the unsubscribe function. */
export function subscribe<R extends SubscriptionGenqlSelection>(
  ws: WsClient, fields: R & {__name?: string}, sink: SubscriptionSink<SubscriptionResult<R>>,
): () => void {
  const {query, variables} = generateSubscriptionOp(fields);
  return ws.subscribe({query, variables}, sink);
}

export type ConnectOptions = NonNullable<Parameters<typeof createClient>[0]> & {
  authHeader?: string;
  authValue?: string;
};

export function connect({url, authHeader, authValue, headers, ...options}: ConnectOptions = {}) {
  const env = typeof process === "undefined" ? {} : process.env;
  const value = authValue ?? env.HYPERFLOW_AUTH_VALUE;
  const resolved = {
    ...options,
    url: url ?? env.HYPERFLOW_API_URL ?? "https://api.hyperflowlabs.com/graphql",
    headers: async () => {
      const merged = new Headers(typeof headers === "function" ? await headers() : headers);
      if (value) merged.set(authHeader ?? env.HYPERFLOW_AUTH_HEADER ?? "x-api-key", value);
      return Object.fromEntries(merged);
    },
  };
  const fetcher = createFetcher(resolved);
  return Object.assign(createClient(resolved), {
    /** Several aliased root fields in one request, e.g. both directions of a wallet's transfers. */
    queryAliased: <R extends AliasedSelection>(selections: R, name?: string): Promise<AliasedResult<R>> =>
      fetcher(generateAliasedQueryOp(selections, name)),
  });
}
