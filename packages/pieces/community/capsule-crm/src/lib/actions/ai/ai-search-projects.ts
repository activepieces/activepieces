import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { projectPageOutputSchema } from '../../common/output-schemas';

export const aiSearchProjects = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_search_projects',
  classification: 'SEARCH',
  displayName: 'Search Projects',
  description: 'Searches projects.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches Capsule CRM projects (called cases or kases in the API) by free text, one page at a time. Leave Query empty to list all. Use the returned id as Project ID in other tools. Read-only.',
    idempotent: true,
  },
  outputSchema: projectPageOutputSchema,
  props: {
    query: Property.ShortText({ displayName: 'Query', description: 'Free text to match, such as the project name. Leave empty to list all.', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1. Defaults to 1.', required: false }),
    per_page: Property.Number({ displayName: 'Per Page', description: 'Results per page, 1-100. Defaults to 50.', required: false }),
  },
  async run({ auth, propsValue }) {
    const paging = capsuleCrmClient.pageArgs({ page: propsValue.page, perPage: propsValue.per_page });
    const result = await capsuleCrmClient.searchProjectsPage({ auth, searchTerm: propsValue.query, ...paging });
    return { projects: result.items, page: paging.page, hasMore: result.hasMore };
  },
});
