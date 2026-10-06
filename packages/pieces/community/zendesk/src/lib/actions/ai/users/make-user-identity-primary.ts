import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskMakeUserIdentityPrimaryOutputSchema } from '../../../output-schemas';

export const zendeskMakeUserIdentityPrimary = createAction({
  auth: zendeskAuth,
  name: 'zendesk_make_user_identity_primary',
  outputSchema: zendeskMakeUserIdentityPrimaryOutputSchema,
  displayName: 'Make User Identity Primary',
  description: 'Make an identity the primary one for its type.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes one identity the primary identity of its type, e.g. the email Zendesk sends notifications to. Returns the user identities after the change.',
    idempotent: true,
  },
  props: {
    user_id: zendeskAiProps.requiredId({ displayName: 'User ID', description: 'Numeric user ID, from Search Users, List Users or Get Current User.' }),
    identity_id: zendeskAiProps.requiredId({ displayName: 'Identity ID', description: 'Numeric identity ID, from List User Identities.' }),
  },
  async run({ auth, propsValue }) {
    const userId = zendeskApi.id({ value: propsValue.user_id, label: 'User ID' });
    const identityId = zendeskApi.id({ value: propsValue.identity_id, label: 'Identity ID' });
    const response = await zendeskApi.request<{ identities: unknown[] }>({
      auth,
      method: HttpMethod.PUT,
      path: `/users/${userId}/identities/${identityId}/make_primary.json`,
    });
    return { identities: response.identities, count: response.identities.length };
  },
});
