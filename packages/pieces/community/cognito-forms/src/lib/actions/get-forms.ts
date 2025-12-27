import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cognitoFormsAuth } from '../../index';

export const cognitoFormsGetForms = createAction({
  auth: cognitoFormsAuth,
  name: 'get_forms',
  displayName: 'Get Forms',
  description: 'Get a list of all forms in your organization',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://www.cognitoforms.com/api/forms',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    return response.body;
  },
});
