import { createAction, OutputSchema } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';

const currentUserOutputSchema = {
  fields: [
    { key: 'uuid', label: 'User UUID' },
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Name' },
    { key: 'organizationId', label: 'Organization ID' },
    { key: 'organizationName', label: 'Organization Name' },
    { key: 'projectId', label: 'Current Project ID', format: 'number' },
    { key: 'projectName', label: 'Current Project Name' },
  ],
} satisfies OutputSchema;

export const getCurrentUser = createAction({
  auth: posthogAuth,
  name: 'get_current_user',
  classification: 'READ',
  displayName: 'Get Current User',
  description: 'Get the PostHog user who owns the API key.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns the PostHog user that owns the connection\'s Personal API Key: uuid, email, name, and the organization and project currently selected in their PostHog UI (which may differ from the connection project). Useful to check which account and organization the connection uses. Never returns keys or tokens. Read-only.',
    idempotent: true,
  },
  outputSchema: currentUserOutputSchema,
  props: {},
  async run({ auth }) {
    const body = await posthogClient.request({ auth: auth.props, method: HttpMethod.GET, path: '/api/users/@me/' });
    const user = posthogClient.recordOf(body);
    const organization = posthogClient.recordOf(user['organization']);
    const team = posthogClient.recordOf(user['team']);
    return {
      uuid: posthogClient.str(user['uuid']),
      email: posthogClient.str(user['email']),
      name: posthogClient.userName(user),
      organizationId: posthogClient.str(organization['id']),
      organizationName: posthogClient.str(organization['name']),
      projectId: posthogClient.num(team['id']),
      projectName: posthogClient.str(team['name']),
    };
  },
});
