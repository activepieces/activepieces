import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cognitoFormsAuth } from '../../index';

export const cognitoFormsUpdateEntry = createAction({
  auth: cognitoFormsAuth,
  name: 'update_entry',
  displayName: 'Update Entry',
  description: 'Update an existing entry in a form',
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form',
      required: true,
    }),
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      description: 'The ID of the entry to update',
      required: true,
    }),
    entryData: Property.Json({
      displayName: 'Entry Data',
      description: 'The updated form field data as JSON',
      required: true,
      defaultValue: {},
    }),
  },
  async run({ auth, propsValue }) {
    const { formId, entryId, entryData } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `https://www.cognitoforms.com/api/forms/${formId}/entries/${entryId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: entryData,
    });

    return response.body;
  },
});
