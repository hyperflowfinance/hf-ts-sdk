import {connect, subscribe, type ConnectOptions, type Scalars, type WsClient} from "@hyperflowlabs/hf-ts-sdk";
import {queryDocument, toDocument, type TypedDocument} from "@hyperflowlabs/hf-ts-sdk/document";

const options: ConnectOptions = {authValue: "", headers: new Headers()};
const client = connect(options);
const result: Promise<{__typename: string}> = client.query({__typename: true});
void result;
void client.query({metadata: {chainId: true}});
// @ts-expect-error Unknown fields must be rejected by the generated schema types.
void client.query({not_a_hyperflow_field: true});

const big: Scalars["BigInt"] = "1";
void big;
const {document} = queryDocument({metadata: {chainId: true}});
type Data = NonNullable<ReturnType<NonNullable<typeof document.__apiType>>>;
const chainId: Data["metadata"]["chainId"] = null;
void chainId;
const parsed: TypedDocument<Data> = toDocument<Data>({query: "{metadata{chainId}}"});
void parsed;
const raw = toDocument({query: "{metadata{chainId}}"});
// @ts-expect-error Raw operations do not carry result type information.
const untyped: TypedDocument<Data> = raw;
void untyped;
const ws: WsClient = {subscribe: () => () => {}};
void client.queryAliased({out: {metadata: {chainId: true}}}).then(data => {
  const id: Data["metadata"]["chainId"] = data.out.chainId; void id;
  // @ts-expect-error Results are keyed by alias, not by root field.
  void data.metadata;
});
subscribe(ws, {newBlocks: {number: true}}, {
  next: ({data}) => { const n: string | null | undefined = data?.newBlocks.number; void n; },
  error: () => {}, complete: () => {},
});
