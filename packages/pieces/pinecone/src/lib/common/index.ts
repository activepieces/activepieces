// import Airtable from "airtable";
// import { PineconeClient } from "@pinecone-database/pinecone";      
import { Property, DynamicPropsValue } from "@activepieces/pieces-framework";
import { HttpMethod, AuthenticationType, httpClient } from "@activepieces/pieces-common";

export const pineconeCommon = {
  index: Property.Dropdown({
    displayName: 'Index',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: "Please connect your account"
        }
      }

      try {
        const response = await httpClient.sendRequest<{ indexes: string[] }>({
            method: HttpMethod.GET,
            url: "https://controller.us-central1-gcp.pinecone.io/databases",
            authentication: {
                type: AuthenticationType.API_KEY,
                apiKey: auth as string
            }
        })
        if (response.status === 200) {
            console.log(response);
            return {
                disabled: true,
                options: response.body.indexes.map((index) => {
                    return { value: index, label: index };
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

      return {
        disabled: true,
        options: []
      }
    }
  }),
}
