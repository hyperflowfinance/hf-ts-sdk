import { createClient } from "./generated";
export * from "./generated";

export type ConnectOptions = NonNullable<Parameters<typeof createClient>[0]> & {
  authHeader?: string;
  authValue?: string;
};

export function connect({url, authHeader, authValue, headers, ...options}: ConnectOptions = {}) {
  const env = typeof process === "undefined" ? {} : process.env;
  const value = authValue ?? env.HYPERFLOW_AUTH_VALUE;
  return createClient({
    ...options,
    url: url ?? env.HYPERFLOW_API_URL ?? "https://api.hyperflowlabs.com/graphql",
    headers: async () => {
      const merged = new Headers(typeof headers === "function" ? await headers() : headers);
      if (value) merged.set(authHeader ?? env.HYPERFLOW_AUTH_HEADER ?? "Authorization", value);
      return Object.fromEntries(merged);
    },
  });
}
