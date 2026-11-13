import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../auth';
import { cognitoRequest } from '../common/client';
import { entryPath, stripEmptyValues } from '../common/entries';
import { entryIdText, formIdDropdown, updateFormFields } from '../common/props';

export const updateEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'update_entry',
  classification: 'WRITE',
  displayName: 'Update Entry',
  description: 'Updates an existing entry. Fields you leave empty keep their current value.',
  audience: 'human',
  aiMetadata: {
    description: 'Updates an existing Cognito Forms entry by entry ID with the fields filled in; empty fields are left unchanged. Idempotent: repeating with the same values leaves the entry in the same state.',
    idempotent: true,
  },
  props: {
    formId: formIdDropdown,
    entryId: entryIdText('The entry number (for example 12) or the full entry ID (for example 5-12). You can map it from a trigger or a "Create Entry" step.'),
    entryData: updateFormFields,
  },
  async run(context) {
    const { formId, entryId, entryData } = context.propsValue;
    const body = stripEmptyValues(entryData);
    if (Object.keys(body).length === 0) {
      throw new Error('Fill in at least one field to update.');
    }
    return cognitoRequest<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: entryPath({ formId: formId, entryId: entryId }),
      body,
    });
  },
});
