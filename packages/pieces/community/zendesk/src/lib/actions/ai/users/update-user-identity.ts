import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskCreateUserIdentityOutputSchema } from '../../../output-schemas';

export const zendeskUpdateUserIdentity = createAction({
  auth: zendeskAuth,
  name: 'zendesk_update_user_identity',
  outputSchema: zendeskCreateUserIdentityOutputSchema,
  displayName: 'Update User Identity',
  description: 'Change the value or verification of a user identity.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates one identity of a user: corrects its value (email or phone) or marks it verified. Omitted fields keep their values. Identity IDs come from List User Identities.',
    idempotent: true,
  },
  props: {
    user_id: zendeskAiProps.requiredId({ displayName: 'User ID', description: 'Numeric user ID, from Search Users.' }),
    identity_id: zendeskAiProps.requiredId({
      displayName: 'Identity ID',
      description: 'Numeric identity ID, from List User Identities.',
    }),
    value: Property.ShortText({ displayName: 'Value', description: 'New email address or phone number.', required: false }),
    verified: zendeskAiProps.optionalBoolean({ displayName: 'Verified', description: 'Yes marks the identity verified.' }),
  },
  async run({ auth, propsValue }) {
    const userId = zendeskApi.id({ value: propsValue.user_id, label: 'User ID' });
    const identityId = zendeskApi.id({ value: propsValue.identity_id, label: 'Identity ID' });
    const identity = zendeskApi.compact({
      value: propsValue.value,
      verified: zendeskApi.optionalBoolean(propsValue.verified),
    });
    if (Object.keys(identity).length === 0) {
      throw new Error('Provide Value or Verified.');
    }
    const response = await zendeskApi.request<{ identity: Record<string, unknown> }>({
      auth,
      method: HttpMethod.PUT,
      path: `/users/${userId}/identities/${identityId}.json`,
      body: { identity },
    });
    return response.identity;
  },
});
