import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient } from '../../common/client';
import { kitGetAccountOutputSchema } from '../../output-schemas';

export const kitGetAccount = createAction({
  auth: convertkitAuth,
  name: 'kit_get_account',
  classification: 'READ',
  outputSchema: kitGetAccountOutputSchema,
  displayName: 'Get Account',
  description: 'Get the name and primary email address of the connected Kit account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the connected Kit account name and primary email address. Use it to confirm which account the connection points at before making changes. Returns no account ID or timezone.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await kitClient.request<Record<string, unknown>>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/account',
    });
    return response.body;
  },
});
