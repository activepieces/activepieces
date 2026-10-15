import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskUserFields } from './user-fields';
import { zendeskGetUserOutputSchema } from '../../../output-schemas';

export const zendeskUpdateUser = createAction({
  auth: zendeskAuth,
  name: 'zendesk_update_user',
  outputSchema: zendeskGetUserOutputSchema,
  displayName: 'Update User',
  description: 'Change fields on an existing user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates one user by ID; omitted fields keep their values. Email here adds a new primary identity rather than editing the old one; manage emails and phones with the user identity actions. Tags replaces the whole set, so prefer Add User Tags or Remove User Tags. Suspended Yes blocks the user from signing in and suspends their new tickets.',
    idempotent: true,
  },
  props: {
    user_id: zendeskAiProps.requiredId({
      displayName: 'User ID',
      description: 'Numeric user ID, from Search Users or List Users.',
    }),
    ...zendeskUserFields.props({ nameRequired: false }),
    suspended: zendeskAiProps.optionalBoolean({
      displayName: 'Suspended',
      description: 'Yes suspends the user, No lifts the suspension.',
    }),
  },
  async run({ auth, propsValue }) {
    const userId = zendeskApi.id({ value: propsValue.user_id, label: 'User ID' });
    const user = zendeskApi.compact({
      ...zendeskUserFields.body(propsValue),
      suspended: zendeskApi.optionalBoolean(propsValue.suspended),
    });
    if (Object.keys(user).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const response = await zendeskApi.request<{ user: Record<string, unknown> }>({
      auth,
      method: HttpMethod.PUT,
      path: `/users/${userId}.json`,
      body: { user },
    });
    return response.user;
  },
});
