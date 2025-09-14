import { createAction } from '@activepieces/pieces-framework';
import { bumpupsAuth, bumpupsCommon } from '../../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const generateCreatorTakeaways = createAction({
  name: 'generateCreatorTakeaways',
  displayName: 'Generate Creator Takeaways',
  description: 'Extract key takeaways (bullet points or summary) from the video.',
  auth: bumpupsAuth,
  props: bumpupsCommon.generateCreatorTakeawaysProperties,
  async run({ auth, propsValue }) {
    const apiKey = auth;
    const { url, model, language, emojis_enabled } = propsValue;

    const requestbody: any = {
      url,
    };

    if (model) {
      requestbody.contextUrl = model;
    }
    if (language) {
      requestbody.contextUrl = language;
    }
    if (emojis_enabled) {
      requestbody.contextUrl = emojis_enabled;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${bumpupsCommon.baseUrl}${bumpupsCommon.endpoints.generateCreatorTakeaways}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: requestbody,
    });
    return response.body;
  },
});
