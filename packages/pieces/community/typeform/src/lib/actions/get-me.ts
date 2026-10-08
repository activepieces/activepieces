import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { accountOutputSchema } from '../output-schemas';

export const getMeAction = createAction({
  auth: typeformAuth,
  name: 'get_me',
  classification: 'READ',
  displayName: 'Get Account',
  description: 'Gets the connected Typeform account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get the connected Typeform account: alias, email and language. Use it to confirm which account is connected. It does not return the account ID; use List Workspaces for that. Read-only.',
    idempotent: true,
  },
  outputSchema: accountOutputSchema,
  props: {},
  async run({ auth }) {
    return typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path: '/me',
    });
  },
});
