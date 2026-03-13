import { createAction, Property } from '@activepieces/pieces-framework';
import { vercelAuth } from '../common/auth';
import { listAllProjects } from '../common/client';

export const listProjects = createAction({
  auth: vercelAuth,
  name: 'list_projects',
  displayName: 'List Projects',
  description: 'Retrieve all Vercel projects for the authenticated user or team.',
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Filter projects by name.',
      required: false,
    }),
  },
  async run(context) {
    const { search } = context.propsValue;
    return await listAllProjects(context.auth, search);
  },
});
