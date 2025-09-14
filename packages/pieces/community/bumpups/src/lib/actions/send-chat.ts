import { createAction } from '@activepieces/pieces-framework';
import { bumpupsAuth, bumpupsCommon } from '../../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sendChat = createAction({
  name: 'sendChat',
  displayName: 'Send Chat',
  description: 'Send a message to Bumpups with a video URL, prompt, model, etc; receive a generated response.',
  auth: bumpupsAuth,
  props: bumpupsCommon.sendChatProperties,
  async run({ auth, propsValue }) {
    const apiKey = auth;
    const { url, model, language, prompt, output_format } = propsValue;

    const requestbody: any = {
      url,
      ...(model && { model }),
      ...(language && { language }),
      ...(prompt && { prompt }),
      ...(output_format && { output_format }),
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${bumpupsCommon.baseUrl}${bumpupsCommon.endpoints.sendChat}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: requestbody,
    });
    return response.body;
  },
});
