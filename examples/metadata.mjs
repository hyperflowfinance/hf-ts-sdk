import {pathToFileURL} from "node:url";
import {connect} from "@hyperflowlabs/hf-ts-sdk";

/** @param {import("@hyperflowlabs/hf-ts-sdk").ConnectOptions} options */
export async function getMetadata(options = {}) {
  const client = connect(options);
  const {metadata} = await client.query({metadata: {chainId: true}});
  return metadata;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(await getMetadata());
}
