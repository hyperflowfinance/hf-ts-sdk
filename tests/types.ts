import {connect, subscribe, type ConnectOptions, type Scalars, type WsClient} from "@hyperflowlabs/hf-ts-sdk";
import {queryDocument} from "@hyperflowlabs/hf-ts-sdk/document";

const options: ConnectOptions = {authValue: "", headers: new Headers()};
const client = connect(options);
const result: Promise<{__typename: string}> = client.query({__typename: true});
void result;
void client.query({metadata: {chainId: true}});
// @ts-expect-error Unknown fields must be rejected by the generated schema types.
void client.query({not_a_hyperflow_field: true});

const big: Scalars["BigInt"] = "1", at: Scalars["DateTime"] = "2026-01-01T00:00:00Z";
void big; void at;
const {document} = queryDocument({metadata: {chainId: true}});
type Data = NonNullable<ReturnType<NonNullable<typeof document.__apiType>>>;
const chainId: Data["metadata"]["chainId"] = null;
void chainId;
const ws: WsClient = {subscribe: () => () => {}};
subscribe(ws, {newBlocks: {number: true}}, {
  next: ({data}) => { const n: string | null | undefined = data?.newBlocks.number; void n; },
  error: () => {}, complete: () => {},
});
