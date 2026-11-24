import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../auth';
import { cognitoRequest } from '../common/client';
import { entryPath } from '../common/entries';
import { entryIdText, formIdDropdown } from '../common/props';

export const getEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'get_entry',
  classification: 'READ',
  displayName: 'Get Entry',
  description: 'Gets an entry by its number or ID.',
  audience: 'human',
  aiMetadata: {
    description: 'Retrieves one Cognito Forms entry by form and entry ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    formId: formIdDropdown,
    entryId: entryIdText('The entry number (for example 12) or the full entry ID (for example 5-12).'),
  },
  async run(context) {
    const { formId, entryId } = context.propsValue;
    return cognitoRequest<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: entryPath({ formId: formId, entryId: entryId }),
    });
  },
});
