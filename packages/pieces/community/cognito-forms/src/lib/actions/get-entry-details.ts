import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest, fetchForms } from '../common';
import { cognitoFormsAuth } from '../../index';

export const getEntryDetailsAction = createAction({
  auth: cognitoFormsAuth,
  name: 'get_entry_details',
  displayName: 'Get Entry Details',
  description: 'Retrieves complete submission data for a specified entry. Useful for auditing, export, or integration into reporting systems.',
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
      description: 'Enter the ID of the entry to retrieve.',
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { formId, entryId } = context.propsValue;

    return await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/forms/${formId}/entries/${entryId}`
    );
  },
});
