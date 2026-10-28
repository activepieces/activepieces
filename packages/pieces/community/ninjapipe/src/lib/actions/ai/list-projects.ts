import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiListProjects = createAction({
  auth: ninjapipeAuth,
  name: 'ai_list_projects',
  classification: 'SEARCH',
  displayName: 'List Projects',
  description: 'Lists projects page by page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List NinjaPipe projects, optionally filtered by free text or status (Planning, In Progress, Completed, On Hold, Cancelled). Returns one page with items, total, hasMore and nextPage. Use it to find the project_id that tasks belong to. Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.projectList,
  props: {
    search: ninjapipeAiProps.text({ displayName: 'Search', description: 'Free text matched against project names.' }),
    status: ninjapipeAiProps.choice({ displayName: 'Status', description: 'Only projects with this status.', values: ['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'] }),
    page: ninjapipeAiProps.page(),
    limit: ninjapipeAiProps.limit(),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.listPage({
      auth: ninjapipeClient.readAuth(context.auth),
      path: '/projects',
      query: { search: p.search, status: p.status },
      page: ninjapipeClient.readPage(p.page),
      limit: ninjapipeClient.clampLimit({ value: p.limit }),
      operation: 'list projects',
    });
  },
});
