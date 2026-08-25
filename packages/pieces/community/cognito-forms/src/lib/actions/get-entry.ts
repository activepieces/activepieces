import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { cognitoFormsAuth } from '../auth';
import { formIdDropdown } from '../common/props';

export const getEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'get_entry',
  displayName: 'Get Entry',
  description: 'Gets a specified entry.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves a single entry from a Cognito Forms form by its entry ID. Choose this to read back the field values of one known submission. Read-only and idempotent; requires both the form ID and the entry ID.', idempotent: true },
  props: {
    formId: formIdDropdown,
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      required: true,
      description: 'Enter the ID of the entry to retrieve.',
    }),
  },
  async run(context) {
    const apiKey = context.auth;
    const { formId, entryId } = context.propsValue;

    return await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/forms/${formId}/entries/${entryId}`
    );
  },
});
