import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest, fetchForms } from '../common';
import { cognitoFormsAuth } from '../../index';

export const deleteEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'delete_entry',
  displayName: 'Delete Entry',
  description: 'Deletes an entry using the specified form ID and entry ID.',
  props: {
    formId: Property.Dropdown({
      displayName: 'Form',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your Cognito Forms account',
            options: [],
          };
        }

        const apiKey = auth as string;
        const forms = await fetchForms(apiKey);

        return {
          options: forms.map((form: any) => ({
            label: form.Name,
            value: form.Id,
          })),
        };
      },
    }),
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      required: true,
      description: 'Enter the ID of the entry to delete.',
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { formId, entryId } = context.propsValue;

    return await makeRequest(
      apiKey,
      HttpMethod.DELETE,
      `/forms/${formId}/entries/${entryId}`
    );
  },
});
