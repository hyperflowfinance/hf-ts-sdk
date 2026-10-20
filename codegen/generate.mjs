import { generate } from "@genql/cli";
import {
  buildClientSchema, getIntrospectionQuery, isScalarType,
  isSpecifiedScalarType, printSchema,
} from "graphql";

const url = process.env.HYPERFLOW_API_URL || "https://api.hyperflowlabs.com/graphql";
const headers = {"Content-Type": "application/json"};
if (process.env.HYPERFLOW_AUTH_VALUE) {
  headers[process.env.HYPERFLOW_AUTH_HEADER || "x-api-key"] =
    process.env.HYPERFLOW_AUTH_VALUE;
}
const response = await fetch(url, {
  method: "POST", headers, signal: AbortSignal.timeout(30_000),
  body: JSON.stringify({query: getIntrospectionQuery()}),
});
if (!response.ok) {
  throw new Error(`Schema introspection failed: HTTP ${response.status}; rerun after rate limits reset.`);
}
const result = await response.json();
if (result.errors?.length || !result.data) {
  throw new Error("Schema introspection failed: GraphQL errors or missing data.");
}
const schema = buildClientSchema(result.data);
const scalarTypes = Object.fromEntries(Object.values(schema.getTypeMap())
  .filter(type => isScalarType(type) && !isSpecifiedScalarType(type))
  .map(type => [type.name, "unknown"]));
await generate({
  schema: printSchema(schema), output: "./src/generated",
  scalarTypes, sortProperties: true,
});
