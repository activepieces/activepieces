import { createAction, Property } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { LIST_LIMIT_DEFAULT, LIST_LIMIT_MAX, userSummary } from '../common';
import { youtrackClient } from '../common/client';
import { listProjectsActionOutputSchema } from '../output-schemas';

const MAX_PROJECTS = 2000;
const PROJECT_FIELDS = 'id,name,shortName,description,archived,leader(id,login,name)';

async function filteredPage({ auth, filter, limit, skip }: { auth: unknown; filter: string; limit: number; skip: number }): Promise<{ items: Record<string, unknown>[]; hasMore: boolean }> {
  const projects = await youtrackClient.listAll({
    auth,
    path: '/admin/projects',
    query: { fields: PROJECT_FIELDS },
    maxItems: MAX_PROJECTS,
    operation: 'list projects',
  });
  const matching = projects.filter((p) => [p['name'], p['shortName']].some((v) => typeof v === 'string' && v.toLowerCase().includes(filter)));
  return { items: matching.slice(skip, skip + limit), hasMore: matching.length > skip + limit };
}

function projectRow(p: Record<string, unknown>): Record<string, unknown> {
  const leader = userSummary(p['leader']);
  return {
    id: p['id'] ?? null,
    name: p['name'] ?? null,
    shortName: p['shortName'] ?? null,
    description: p['description'] ?? null,
    archived: p['archived'] ?? null,
    leader_login: leader.login,
    leader_name: leader.name,
  };
}

export const listProjectsAction = createAction({
  auth: youtrackAuth,
  name: 'list_projects',
  classification: 'SEARCH',
  outputSchema: listProjectsActionOutputSchema,
  displayName: 'List Projects',
  description: 'Lists the YouTrack projects you can see, optionally filtered by name or short name.',
  audience: 'both',
  aiMetadata: {
    description:
      'List YouTrack projects visible to the connected account, with each project\'s ID (like "0-5"), short name (like "APT") and name; optionally filter by a text contained in the name or short name. Use to find the project ID for Create Issue, Get Project, List Project Custom Fields or Create Article, or the short name for Search Issues. Returns items plus hasMore; use Skip for the next page. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Filter',
      description: 'Only projects whose name or short name contains this text (case-insensitive). Leave empty for all.',
      required: false,
    }),
    limit: Property.Number({ displayName: 'Limit', description: `Max projects to return (1-${LIST_LIMIT_MAX}). Default ${LIST_LIMIT_DEFAULT}.`, required: false }),
    skip: Property.Number({ displayName: 'Skip', description: 'Number of matching projects to skip. Default 0.', required: false }),
  },
  async run(context) {
    const limit = youtrackClient.boundedLimit({ value: context.propsValue.limit, fallback: LIST_LIMIT_DEFAULT, max: LIST_LIMIT_MAX });
    const skip = context.propsValue.skip === undefined || context.propsValue.skip === null
      ? 0
      : youtrackClient.nonNegativeInteger({ value: context.propsValue.skip, label: 'Skip' });
    const filter = youtrackClient.optionalText(context.propsValue.query)?.toLowerCase();
    const { items, hasMore } = filter === undefined
      ? await youtrackClient.listPage({ auth: context.auth, path: '/admin/projects', query: { fields: PROJECT_FIELDS }, limit, skip, operation: 'list projects' })
      : await filteredPage({ auth: context.auth, filter, limit, skip });
    return { items: items.map(projectRow), hasMore };
  },
});
