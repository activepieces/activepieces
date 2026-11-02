import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskDeleteUserIdentityOutputSchema } from '../../../output-schemas';

export const zendeskDeleteUserIdentity = createAction({
  auth: zendeskAuth,
  name: 'zendesk_delete_user_identity',
  outputSchema: zendeskDeleteUserIdentityOutputSchema,
  displayName: 'Delete User Identity',
  description: 'Remove an email, phone or other identity from a user.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes one identity (email, phone or social account) from a user. The primary identity cannot be deleted; make another identity primary first with Make User Identity Primary.',
    idempotent: true,
  },
  props: {
    user_id: zendeskAiProps.requiredId({ displayName: 'User ID', description: 'Numeric user ID, from Search Users, List Users or Get Current User.' }),
    identity_id: zendeskAiProps.requiredId({ displayName: 'Identity ID', description: 'Numeric identity ID, from List User Identities.' }),
  },
  async run({ auth, propsValue }) {
    const userId = zendeskApi.id({ value: propsValue.user_id, label: 'User ID' });
    const identityId = zendeskApi.id({ value: propsValue.identity_id, label: 'Identity ID' });
    await zendeskApi.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/users/${userId}/identities/${identityId}.json`,
    });
    return { success: true, user_id: Number(userId), identity_id: Number(identityId) };
  },
});
