import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const deleteEntry = createAction({

  name: 'deleteEntry',
  displayName: 'Delete Entry',
  description: 'Delete an existing entry from a Cognito Form',
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form containing the entry',
      required: true,
    }),
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      description: 'The ID of the entry to delete',
      required: true,
    }),
  },
  async run(context) {
    const { formId, entryId } = context.propsValue;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://www.cognitoforms.com/api/forms/${formId}/entries/${entryId}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
