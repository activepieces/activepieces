import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { cognitoFormsAuth } from '../auth';
import { formIdDropdown } from '../common/props';

export const deleteEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'delete_entry',
  displayName: 'Delete Entry',
  description: 'Deletes a specified entry.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a single entry from a Cognito Forms form, identified by its entry ID. Choose this to remove a specific submission you can identify by ID. Idempotent: once the entry is gone, repeating the call converges to the same deleted state.', idempotent: true },
  props: {
    formId: formIdDropdown,
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      required: true,
      description: 'Enter the ID of the entry to delete.',
    }),
  },
  async run(context) {
    const apiKey = context.auth;
    const { formId, entryId } = context.propsValue;

    return await makeRequest(
      apiKey,
      HttpMethod.DELETE,
      `/forms/${formId}/entries/${entryId}`
    );
  },
});
