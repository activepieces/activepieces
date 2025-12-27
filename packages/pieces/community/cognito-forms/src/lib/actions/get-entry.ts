import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cognitoFormsAuth } from '../../index';

export const cognitoFormsGetEntry = createAction({
  auth: cognitoFormsAuth,
  name: 'get_entry',
  displayName: 'Get Entry',
  description: 'Get a specific entry by ID',
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form',
      required: true,
    }),
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      description: 'The ID of the entry to retrieve',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { formId, entryId } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://www.cognitoforms.com/api/forms/${formId}/entries/${entryId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    return response.body;
  },
});
