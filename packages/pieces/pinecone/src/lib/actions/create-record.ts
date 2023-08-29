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
    
    const fieldsWithoutEmptyStrings: DynamicPropsValue = {}
    try {
      const response = await httpClient.sendRequest<string[]>({
          method: HttpMethod.GET,
          url: "https://controller.us-central1-gcp.pinecone.io/databases",
          authentication: {
              type: AuthenticationType.API_KEY, // The actual type will depend on how your httpClient is implemented
              apiKey: auth as string
            }
        })
        if (response.status === 200) {
          return {
            disabled: false,
            options: response.body.map((optionName) => {
              return { value: optionName, label: optionName };
            })
          }
        }
    } catch (e) {
      console.debug(e)
      return {
        disabled: true,
        options: [],
        placeholder: "Please check your permission scope"
      }
    }

    
    return index;
  },
})
