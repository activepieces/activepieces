import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskUserFields } from './user-fields';
import { zendeskCreateOrUpdateUserOutputSchema } from '../../../output-schemas';

export const zendeskCreateOrUpdateUser = createAction({
  auth: zendeskAuth,
  name: 'zendesk_create_or_update_user',
  outputSchema: zendeskCreateOrUpdateUserOutputSchema,
  displayName: 'Create or Update User',
  description: 'Update the user with this email or external ID, or create one.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Upserts one user: Zendesk matches an existing user by Email or External ID (pass at least one) and updates the given fields, otherwise creates the user. created is true when a new user was made. Safe to retry. Use Update User when you already hold the user ID.',
    idempotent: true,
  },
  props: zendeskUserFields.props({ nameRequired: true }),
  async run({ auth, propsValue }) {
    if (!propsValue.email && !propsValue.external_id) {
      throw new Error('Pass Email or External ID so Zendesk can match an existing user.');
    }
    const response = await zendeskApi.send<{ user: Record<string, unknown> }>({
      auth,
      method: HttpMethod.POST,
      path: '/users/create_or_update.json',
      body: { user: zendeskUserFields.body(propsValue) },
    });
    return { created: response.status === 201, user: response.body.user };
  },
});
