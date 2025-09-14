import { createAction } from '@activepieces/pieces-framework';
import { bumpupsAuth, bumpupsCommon } from '../../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const generateTimestamps = createAction({
  name: 'generateTimestamps',
  displayName: 'Generate Timestamps',
  description: 'Generate timestamped sections for the video (e.g. by detecting chapters/topics).',
  auth: bumpupsAuth,
  props: bumpupsCommon.generateTimestampsProperties,
  async run({ auth, propsValue }) {
    const apiKey = auth;
    const { url, model, language, timestamps_style } = propsValue;

    const requestbody: any = {
      url,
    };

    if (model) {
      requestbody.contextUrl = model;
    }
    if (language) {
      requestbody.contextUrl = language;
    }
    if (timestamps_style) {
      requestbody.contextUrl = timestamps_style;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${bumpupsCommon.baseUrl}${bumpupsCommon.endpoints.generateTimestamps}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: requestbody,
    });
    return response.body;
  },
});
