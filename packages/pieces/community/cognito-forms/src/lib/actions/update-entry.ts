import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest, fetchForms } from '../common';
import { cognitoFormsAuth } from '../../index';

export const updateEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'update_entry',
  displayName: 'Update Entry',
  description: 'Update an existing form entry using the form ID and entry ID. Only the provided fields will be updated.',
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
      description: 'Enter the ID of the entry you want to update.',
    }),
    updatedData: Property.Json({
      displayName: 'Updated Entry Data',
      required: true,
      description:
        'The fields to update. This is a PATCH operation — only include the fields you want to change. To clear a field, set it to null or an empty array.',
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { formId, entryId, updatedData } = context.propsValue;

    const body: {
      [key: string]: any;
    } = {
      ...updatedData,
    };

    return await makeRequest(
      apiKey,
      HttpMethod.PATCH,
      `/forms/${formId}/entries/${entryId}`,
      body
    );
  },
});
