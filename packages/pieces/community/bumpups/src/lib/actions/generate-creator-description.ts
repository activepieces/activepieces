import { createAction } from '@activepieces/pieces-framework';
import { bumpupsAuth, bumpupsCommon } from '../../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const generateCreatorDescription = createAction({
  name: 'generateCreatorDescription',
  displayName: 'Generate Creator Description',
  description: 'Generate or rewrite a description for the video using AI.',
  auth: bumpupsAuth,
  props: bumpupsCommon.generateCreatorDescriptionProperties,
  async run({ auth, propsValue }) {
    const apiKey = auth;
    const { url, model, language } = propsValue;

    const requestbody: any = {
      url,
    };

    if (model) {
      requestbody.contextUrl = model;
    }
    if (language) {
      requestbody.contextUrl = language;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${bumpupsCommon.baseUrl}${bumpupsCommon.endpoints.generateCreatorDescription}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: requestbody,
    });
    return response.body;
  },
});
