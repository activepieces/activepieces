import { createAction } from '@activepieces/pieces-framework';
import { bufferAuth } from '../../common/auth';
import { bufferClient } from '../../common/client';
import { bufferQueries } from '../../common/queries';
import { listOrganizationsOutputSchema } from '../../common/output-schemas';

export const listOrganizations = createAction({
  auth: bufferAuth,
  name: 'list_organizations',
  classification: 'READ',
  displayName: 'List Organizations',
  description: 'Get the connected Buffer account, its timezone and its organizations.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the connected Buffer account (name, email, timezone) and every organization it belongs to, with each organization ID, channel count, member count and plan limits. Call it first: every other Buffer tool needs an Organization ID from here, and the timezone helps turn "tomorrow at 9am" into an ISO 8601 time with an offset. If there are several organizations, ask which one is meant. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: listOrganizationsOutputSchema,
  async run(context) {
    const data = await bufferClient.graphql<{ account: Record<string, unknown> }>({
      accessToken: context.auth.secret_text,
      query: bufferQueries.ACCOUNT,
      operation: 'load your account',
    });
    return data.account;
  },
});
