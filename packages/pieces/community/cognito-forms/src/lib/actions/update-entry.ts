import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateEntry = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updateEntry',
  displayName: 'Update Entry',
  description: 'Update an existing entry in a Cognito Form',
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form containing the entry',
      required: true,
    }),
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      description: 'The ID of the entry to update',
      required: true,
    }),
    entryData: Property.Object({
      displayName: 'Entry Data',
      description: 'The updated data for the entry',
      required: true,
    }),
  },
  async run(context) {
    const { formId, entryId, entryData } = context.propsValue;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `https://www.cognitoforms.com/api/forms/${formId}/entries/${entryId}`,
      body: entryData,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
