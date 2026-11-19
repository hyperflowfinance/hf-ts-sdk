import {generateQueryOp, type QueryGenqlSelection, type QueryResult} from "./generated";

/** Alias → selection of exactly one root field, e.g. `{out: {transactions: {...}}}`. */
export type AliasedSelection = Record<string, QueryGenqlSelection>;
export type AliasedResult<R extends AliasedSelection> = {
  [K in keyof R]: QueryResult<R[K]>[keyof QueryResult<R[K]>];
};

const NAME = /^[_A-Za-z][_0-9A-Za-z]*$/;

/**
 * One GraphQL document that runs several root fields, each under its own alias
 * (Genql has no alias syntax). Values stay in variables, namespaced per alias.
 */
export function generateAliasedQueryOp(selections: AliasedSelection, name = "") {
  if (name && !NAME.test(name)) throw new Error(`invalid operation name \`${name}\``);
  const declarations: string[] = [], fields: string[] = [], fragments: string[] = [];
  const variables: Record<string, unknown> = {};
  for (const [alias, {__name: _, ...selection}] of
    Object.entries(selections) as [string, QueryGenqlSelection & {__name?: string}][]) {
    if (!NAME.test(alias)) throw new Error(`invalid alias \`${alias}\``);
    if (Object.keys(selection).length !== 1) {
      throw new Error(`alias \`${alias}\` must select exactly one root field`);
    }
    const op = generateQueryOp(selection);
    // Generated queries hold no literals, so braces and `$vN`/`fN` names are structural.
    const query = op.query
      .replace(/\$v(\d+)\b/g, `$${alias}_v$1`)
      .replace(/(\.\.\.|fragment )f(\d+)\b/g, `$1${alias}_f$2`);
    const open = query.indexOf("{");
    let depth = 0, end = open;
    do depth += query[end] === "{" ? 1 : query[end] === "}" ? -1 : 0; while (++end, depth);
    const head = /\((.*)\)\s*$/.exec(query.slice(0, open));
    if (head) declarations.push(head[1]);
    fields.push(`${alias}:${query.slice(open + 1, end - 1)}`);
    fragments.push(query.slice(end));
    for (const [key, value] of Object.entries(op.variables ?? {})) variables[`${alias}_${key}`] = value;
  }
  if (!fields.length) throw new Error("at least one alias is required");
  const vars = declarations.length ? `(${declarations.join(",")})` : "";
  return {query: `query ${name}${vars}{${fields.join(",")}}${fragments.join("")}`, variables};
}
