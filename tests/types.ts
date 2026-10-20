import {connect, type ConnectOptions} from "@hyperflowlabs/hf-ts-sdk";

const options: ConnectOptions = {authValue: "", headers: new Headers()};
const client = connect(options);
const result: Promise<{__typename: string}> = client.query({__typename: true});
void result;
void client.query({metadata: {chainId: true}});
// @ts-expect-error Unknown fields must be rejected by the generated schema types.
void client.query({not_a_hyperflow_field: true});
