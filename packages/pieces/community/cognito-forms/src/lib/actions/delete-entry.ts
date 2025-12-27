import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cognitoFormsAuth } from '../../index';

export const cognitoFormsDeleteEntry = createAction({
  auth: cognitoFormsAuth,
  name: 'delete_entry',
  displayName: 'Delete Entry',
  description: 'Delete an entry from a form',
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form',
      required: true,
    }),
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      description: 'The ID of the entry to delete',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { formId, entryId } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://www.cognitoforms.com/api/forms/${formId}/entries/${entryId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    return {
      success: true,
      message: `Entry ${entryId} deleted successfully`,
    };
  },
});
