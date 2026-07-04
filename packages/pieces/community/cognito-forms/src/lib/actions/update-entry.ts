import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { cognitoFormsAuth } from '../auth';
import { formFields, formIdDropdown } from '../common/props';

export const updateEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'update_entry',
  displayName: 'Update Entry',
  description: 'Update an existing entry.',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing entry in a Cognito Forms form, identified by its entry ID, applying the provided field values. Choose this when you already have the entry ID and want to modify its data rather than create a new one. Idempotent: repeating with the same field values leaves the entry in the same state.', idempotent: true },
  props: {
    formId: formIdDropdown,
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      required: true,
      description: 'Enter the ID of the entry you want to update.',
    }),
    entryData: formFields,
  },
  async run(context) {
    const apiKey = context.auth;
    const { formId, entryId, entryData } = context.propsValue;

    return await makeRequest(
      apiKey,
      HttpMethod.PATCH,
      `/forms/${formId}/entries/${entryId}`,
      entryData
    );
  },
});
