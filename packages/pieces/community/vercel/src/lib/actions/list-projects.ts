import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vercelAuth } from '../common/auth';
import { vercelApiCall } from '../common/client';

export const listProjects = createAction({
  auth: vercelAuth,
  name: 'list_projects',
  displayName: 'List Projects',
  description: 'Retrieve Vercel projects for the authenticated user or team.',
  props: {
    limit: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of projects to return (1-100).',
      required: false,
      defaultValue: 20,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Optional project name search query.',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'Pagination Cursor',
      description: 'Optional continuation token returned by a previous request.',
      required: false,
    }),
  },
  async run(context) {
    const { limit, search, from } = context.propsValue;
    const normalizedLimit = Math.min(100, Math.max(1, limit ?? 20));

    return await vercelApiCall({
      method: HttpMethod.GET,
      path: '/v10/projects',
      auth: context.auth,
      query: {
        limit: normalizedLimit,
        search,
        from,
      },
    });
  },
});
