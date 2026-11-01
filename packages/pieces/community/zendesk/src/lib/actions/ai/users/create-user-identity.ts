import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskCreateUserIdentityOutputSchema } from '../../../output-schemas';

export const zendeskCreateUserIdentity = createAction({
  auth: zendeskAuth,
  name: 'zendesk_create_user_identity',
  outputSchema: zendeskCreateUserIdentityOutputSchema,
  displayName: 'Create User Identity',
  description: 'Add an email, phone or other identity to a user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds one identity to a user: an email address, phone number or social handle. Fails with 422 when the value already belongs to any user. Not idempotent. Make it primary with Make User Identity Primary.',
    idempotent: false,
  },
  props: {
    user_id: zendeskAiProps.requiredId({ displayName: 'User ID', description: 'Numeric user ID, from Search Users.' }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Phone number', value: 'phone_number' },
          { label: 'X (Twitter)', value: 'twitter' },
          { label: 'Facebook', value: 'facebook' },
          { label: 'Google', value: 'google' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'The email address, phone number in E.164 format, or handle.',
      required: true,
    }),
    verified: zendeskAiProps.optionalBoolean({
      displayName: 'Verified',
      description: 'Mark the identity as verified so Zendesk sends no verification message.',
    }),
  },
  async run({ auth, propsValue }) {
    const userId = zendeskApi.id({ value: propsValue.user_id, label: 'User ID' });
    const response = await zendeskApi.request<{ identity: Record<string, unknown> }>({
      auth,
      method: HttpMethod.POST,
      path: `/users/${userId}/identities.json`,
      body: {
        identity: zendeskApi.compact({
          type: propsValue.type,
          value: propsValue.value,
          verified: zendeskApi.optionalBoolean(propsValue.verified),
        }),
      },
    });
    return response.identity;
  },
});
