import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseAiProps } from '../../../common/ai-props';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseListAuthMethodsOutputSchema } from '../../../output-schemas';

export const listAuthMethodsAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_list_auth_methods',
  outputSchema: pocketbaseListAuthMethodsOutputSchema,
  displayName: 'List Auth Methods',
  description: 'Lists the sign-in methods enabled for an auth collection.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns which sign-in methods (password, OAuth2 providers, MFA, OTP) an auth collection allows. The collection must be of type "auth", e.g. "users" or "_superusers"; List Collections shows each type.',
    idempotent: true,
  },
  props: {
    collection: pocketbaseAiProps.collection({ required: true }),
  },
  async run(context) {
    return await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/api/collections/${encodeURIComponent(context.propsValue.collection)}/auth-methods`,
    });
  },
});
