
import {createAction, createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import isUrl from 'is-url';
import { blob } from "stream/consumers";

const flowiseAuth = PieceAuth.CustomAuth({
    description: 'Enter your Flowise URL and API Key',
    props: {
        base_url: Property.ShortText({
            displayName: 'Base URL',
            description: 'Enter the base URL',
            required: true,
        }),
        access_token: PieceAuth.SecretText({
            displayName: 'API Key',
            description: 'Enter the API Key',
            required: true
        })
    },
    required: true
})


// /api/v1/prediction/{your-chatflowid}
export const flowisePredict = createAction({
  name: "run_flowise_predict",
  displayName: "Flowise Predict API",
  description: "Run Flowise Predict",
  auth: flowiseAuth,
  props: {
    chatflow_id: Property.ShortText({
      displayName: "Chatflow ID",
      description: "Enter the Chatflow ID",
      required: true,
    }),
    input: Property.ShortText({
      displayName: "Input/Question",
      description: "Enter the Input/Question",
      required: true,
    }),
    history: Property.Json({
      displayName: "History",
      description: "Enter the History",
      required: false,
    }),
    overrideConfig: Property.Json({
      displayName: "Override Config",
      description: "Enter the Override Config",
      required: false,
    }),
  },
  async run (ctx) {
    const { base_url, access_token } = ctx.auth;
    const chatflow_id = ctx.propsValue['chatflow_id']
    const input = ctx.propsValue['input']
    const url = `${base_url}/api/v1/prediction/${chatflow_id}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    }
    const body = {
      "question": input,
      "history": ctx.propsValue['history'],
      "overrideConfig": ctx.propsValue['overrideConfig']
    }
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
    const data = await response.json();
    return data;
  }
})



// // /api/v1/vector/upsert/{your-chatflowid}
export const flowiseUpsert = createAction({
    name: "run_flowise_vectore_upsert",
  displayName: "Flowise Vector Upsert API",
  description: "Upsert a Vector to Flowise",
  auth: flowiseAuth,
  props: {
    chatflow_id: Property.ShortText({
      displayName: "Chatflow ID",
      description: "Enter the Chatflow ID",
      required: true,
    }),
    stop_node_id: Property.ShortText({
      displayName: "Vector Store Node ID",
      description: "Enter the Node ID of the vector store you want to upsert to (optional)",
      required: false,
    }),
    overrideConfig: Property.Json({
      displayName: "Override Config",
      description: "Enter the Override Config",
      required: false,
    }),
    file_upload: Property.ShortText({
      displayName: "File URL or Base64 with Mime Type",
      description: "Upload file to upsert as a vector",
      required: true,
    }),
    return_source: Property.Checkbox({
      displayName: "Return Source",
      description: "Return the source document of the vector",
      required: false,
    })
  },
  async run (ctx) {
    const { base_url, access_token } = ctx.auth;
    const {chatflow_id, stop_node_id, overrideConfig, file_upload, return_source} = ctx.propsValue;
    const url = `${base_url}/api/v1/prediction/${chatflow_id}`;
    if (file_upload === undefined || file_upload === null) {
      throw new Error('File is required to upsert a vector');
    }
    let formData = new FormData();
    

    if (isUrl(file_upload)) {

      const response = await fetch(file_upload);
        if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const fileBlob = await response.blob();
      formData.append('files', fileBlob, 'filename');

    }
    console.log(file_upload)

    // formData.append('overrideConfig', JSON.stringify(overrideConfig));
    // formData.append('stopNodeId', JSON.stringify(stop_node_id));
    // formData.append('returnSourceDocuments', JSON.stringify(return_source));

    // const body = {
    //   "overrideConfig": overrideConfig,
    //   "stopNodeId": stop_node_id,
    //   "returnSourceDocuments": return_source,
    //   "files": file_upload
    // }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'multipart/form-data'
      },
      body: formData
    });
   
    return await response.json()
  }

})


// TODO: Implement Messages API
// GET
// /api/v1/chatmessage/{your-chatflowid}

// DELETE
// /api/v1/chatmessage/{your-chatflowid}

export const flowise = createPiece({
  displayName: "Flowise",
  logoUrl: "https://www.gitbook.com/cdn-cgi/image/width=36,dpr=2,height=36,fit=contain,format=auto/https%3A%2F%2F1778525056-files.gitbook.io%2F~%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252Fy8ifwt9BYklr92KDdr48%252Ficon%252F97nC5fsqCUgneLnMjAtJ%252FFloWiseAI_dark.png%3Falt%3Dmedia%26token%3D1083d5e8-2017-4273-afe7-f326846dffac",
  auth: flowiseAuth,
  minimumSupportedRelease: '0.9.0',
  authors: [],
  actions: [flowisePredict, flowiseUpsert],
  triggers: [],
});
