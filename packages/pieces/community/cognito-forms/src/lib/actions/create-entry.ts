import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest, fetchForms } from '../common';
import { cognitoFormsAuth } from '../../index';

export const createEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'create_entry',
  displayName: 'Create Entry',
  description: 'Submit a new entry to a Cognito Form using the form ID and entry data.',
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
    entryData: Property.Json({
      displayName: 'Entry Data',
      required: true,
      description:
        'The form field values to submit. Refer to the form schema to know what keys are required. Example: { "Name": "John Doe", "Email": "john@example.com" }',
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { formId, entryData } = context.propsValue;

    const body: {
      [key: string]: any;
    } = {
      ...entryData,
    };

    return await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/forms/${formId}/entries`,
      body
    );
  },
});
