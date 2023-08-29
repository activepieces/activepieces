import { DynamicPropsValue, createAction } from "@activepieces/pieces-framework";
import { pineconeCommon } from "../common";
import { pineconeAuth } from "../../index";

export const pineconeCreateRecordAction = createAction({
  auth: pineconeAuth,
  name: 'pinecone_create_record',
  displayName: 'Create Pinecone Record',
  description: 'Adds a record into a pinecone index',
  props: {
    index: pineconeCommon.index,
  },
  async run(context) {
    const apiKey = context.auth
    const index = context.propsValue
    return index;
  },
})
