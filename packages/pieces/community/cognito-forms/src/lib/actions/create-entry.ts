import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cognitoFormsAuth } from '../../index';

export const cognitoFormsCreateEntry = createAction({
  auth: cognitoFormsAuth,
  name: 'create_entry',
  displayName: 'Create Entry',
  description: 'Create a new entry in a form',
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form to create an entry in',
      required: true,
    }),
    entryData: Property.Json({
      displayName: 'Entry Data',
      description: 'The form field data as JSON. Field names must match your form fields.',
      required: true,
      defaultValue: {},
    }),
  },
  async run({ auth, propsValue }) {
    const { formId, entryData } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://www.cognitoforms.com/api/forms/${formId}/entries`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: entryData,
    });

    return response.body;
  },
});
