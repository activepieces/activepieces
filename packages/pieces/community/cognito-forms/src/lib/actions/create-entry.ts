import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { cognitoFormsAuth } from '../auth';
import { formFields, formIdDropdown } from '../common/props';

export const createEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'create_entry',
  displayName: 'Create Entry',
  description: 'Creates a new entry.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new entry (form submission) in a specified Cognito Forms form. Choose this to submit data into a form programmatically; the entry field values must match the target form\'s schema. Not idempotent: each call creates a separate entry.', idempotent: false },
  props: {
    formId: formIdDropdown,
    entryData: formFields,
  },
  async run(context) {
    const apiKey = context.auth;
    const { formId, entryData } = context.propsValue;

    return await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/forms/${formId}/entries`,
      entryData
    );
  },
});
