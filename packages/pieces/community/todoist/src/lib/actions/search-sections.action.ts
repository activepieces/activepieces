import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistRestClient } from '../common/client/rest-client';
import { todoistAuth } from '../..';

export const todoistSearchSectionsAction = createAction({
  auth: todoistAuth,
  name: 'todoist_search_sections',
  displayName: 'Search Sections',
  description: 'Search Todoist sections by name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Finds Todoist sections whose name contains the given query (case-insensitive substring match), optionally scoped to one project via project_id. Use to resolve a section by a partial or remembered name to its ID; to list every section use List Sections, to fetch one known ID use Get Section. Read-only and idempotent; matches client-side, so a blank query returns all sections in scope.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        "Case-insensitive substring to match against section names, e.g. 'todo'. Leave blank to return all sections in scope.",
      required: false,
    }),
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description:
        'Restrict the search to sections in this project. Resolve via List Projects. Leave blank to search all projects.',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { query, project_id } = context.propsValue;
    assertNotNullOrUndefined(token, 'token');

    const sections = await todoistRestClient.sections.list({ token, project_id });
    const needle = (query ?? '').trim().toLowerCase();
    const matches = needle
      ? sections.filter((s) => s.name.toLowerCase().includes(needle))
      : sections;

    return {
      sections: matches,
      count: matches.length,
    };
  },
});
