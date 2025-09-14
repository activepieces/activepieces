import { createAction } from '@activepieces/pieces-framework';
import { bumpupsAuth, bumpupsCommon } from '../../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const generateCreatorHashtags = createAction({
  name: 'generateCreatorHashtags',
  displayName: 'Generate Creator Hashtags',
  description: 'Produce hashtags suitable for a video based on its content.',
  auth: bumpupsAuth,
  props: bumpupsCommon.generateCreatorHashtagsProperties,
  async run({ auth, propsValue }) {
    const apiKey = auth;
    const { url, model, language, output_format } = propsValue;

    const requestbody: any = {
      url,
    };

    if (model) {
      requestbody.contextUrl = model;
    }
    if (language) {
      requestbody.contextUrl = language;
    }
    if (output_format) {
      requestbody.contextUrl = output_format;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${bumpupsCommon.baseUrl}${bumpupsCommon.endpoints.generateCreatorHashtags}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: requestbody,
    });
    return response.body;
  },
});
