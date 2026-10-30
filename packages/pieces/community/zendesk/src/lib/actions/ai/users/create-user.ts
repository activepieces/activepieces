import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskUserFields } from './user-fields';
import { zendeskCreateUserOutputSchema } from '../../../output-schemas';

export const zendeskCreateUser = createAction({
  auth: zendeskAuth,
  name: 'zendesk_create_user',
  outputSchema: zendeskCreateUserOutputSchema,
  displayName: 'Create User',
  description: 'Create an end user, agent or admin.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates one user; role defaults to end user. Fails with 422 when the email or external ID already belongs to a user, so use Create or Update User to avoid duplicates, or Search Users first. Not idempotent.',
    idempotent: false,
  },
  props: zendeskUserFields.props({ nameRequired: true }),
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ user: Record<string, unknown> }>({
      auth,
      method: HttpMethod.POST,
      path: '/users.json',
      body: { user: zendeskUserFields.body(propsValue) },
    });
    return response.user;
  },
});
