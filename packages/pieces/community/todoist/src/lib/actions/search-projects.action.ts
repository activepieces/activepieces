import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistRestClient } from '../common/client/rest-client';
import { todoistAuth } from '../..';

export const todoistSearchProjectsAction = createAction({
  auth: todoistAuth,
  name: 'todoist_search_projects',
  displayName: 'Search Projects',
  description: 'Search Todoist projects by name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Finds Todoist projects whose name contains the given query (case-insensitive substring match over all active projects). Use to resolve a project by a partial or remembered name to its ID; to list every project use List Projects, to fetch one known ID use Get Project. Read-only and idempotent; matches client-side, so a blank query returns all projects.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        "Case-insensitive substring to match against project names, e.g. 'work'. Leave blank to return all projects.",
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { query } = context.propsValue;
    assertNotNullOrUndefined(token, 'token');

    const projects = await todoistRestClient.projects.list({ token });
    const needle = (query ?? '').trim().toLowerCase();
    const matches = needle
      ? projects.filter((p) => p.name.toLowerCase().includes(needle))
      : projects;

    return {
      projects: matches,
      count: matches.length,
    };
  },
});
