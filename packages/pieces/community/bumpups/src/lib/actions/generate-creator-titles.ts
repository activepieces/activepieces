import { createAction } from '@activepieces/pieces-framework';
import { bumpupsAuth, bumpupsCommon } from '../../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const generateCreatorTitles = createAction({
  name: 'generateCreatorTitles',
  displayName: 'Generate Creator Titles',
  description: 'Generate several optimized video titles based on a video URL using AI model.',
  auth: bumpupsAuth,
  props: bumpupsCommon.generateCreatorTitlesProperties,
  async run({ auth, propsValue }) {
    const apiKey = auth;
    const { url, model, language } = propsValue;

    const requestbody: any = {
      url,
      ...(model && { model }),
      ...(language && { language }),
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${bumpupsCommon.baseUrl}${bumpupsCommon.endpoints.generateCreatorTitles}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: requestbody,
    });
    return response.body;
  },
});
