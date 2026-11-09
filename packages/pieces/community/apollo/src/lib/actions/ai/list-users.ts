import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiListUsersAction = createAction({
  auth: apolloAuth,
  name: 'ai_list_users',
  classification: 'SEARCH',
  displayName: 'List Users',
  description: 'List the users in your Apollo workspace.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the users (teammates) in your Apollo workspace with ID, name and email, for owner_id and task assignee user_id. For only the user the API key acts as, Get Credit Usage is cheaper. Uses no credits; needs a paid plan and may need a master API key.',
    idempotent: true,
  },
  props: {
    page: aiProps.page(),
    per_page: aiProps.perPage({ max: 100, fallback: 100 }),
  },
  outputSchema: apolloOutputSchemas.users,
  async run({ propsValue, auth }) {
    const { page, perPage } = apolloInputs.pageParams({ page: propsValue.page, perPage: propsValue.per_page, maxPerPage: 100, defaultPerPage: 100 });
    const body = await apolloRequests.listUsers({ apiKey: apiKeyOf(auth), page, perPage });
    const users = recordsOf(body['users']).map((user) => apolloMappers.user(user));
    return { ...apolloMappers.pageInfo({ body, page, perPage, returned: users.length }), users };
  },
});
