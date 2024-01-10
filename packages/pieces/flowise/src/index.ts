
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

export const flowise = createPiece({
  displayName: "Flowise",
  logoUrl: "https://www.gitbook.com/cdn-cgi/image/width=36,dpr=2,height=36,fit=contain,format=auto/https%3A%2F%2F1778525056-files.gitbook.io%2F~%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252Fy8ifwt9BYklr92KDdr48%252Ficon%252F97nC5fsqCUgneLnMjAtJ%252FFloWiseAI_dark.png%3Falt%3Dmedia%26token%3D1083d5e8-2017-4273-afe7-f326846dffac",
  auth: flowiseAuth,
  minimumSupportedRelease: '0.9.0',
  authors: [],
  actions: [flowisePredict],
  triggers: [],
});
