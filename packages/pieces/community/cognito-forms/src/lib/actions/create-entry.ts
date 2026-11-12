import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../auth';
import { cognitoRequest } from '../common/client';
import { formPath, stripEmptyValues } from '../common/entries';
import { formFields, formIdDropdown } from '../common/props';

export const createEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'create_entry',
  classification: 'WRITE',
  displayName: 'Create Entry',
  description: 'Creates a new entry in a form.',
  audience: 'human',
  aiMetadata: {
    description: 'Creates a new entry (form submission) in a Cognito Forms form using fields picked from the form. Not idempotent: each call creates a separate entry.',
    idempotent: false,
  },
  props: {
    formId: formIdDropdown,
    entryData: formFields,
  },
  async run(context) {
    const { formId, entryData } = context.propsValue;
    return cognitoRequest<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `${formPath(formId)}/entries`,
      body: stripEmptyValues(entryData),
    });
  },
});
