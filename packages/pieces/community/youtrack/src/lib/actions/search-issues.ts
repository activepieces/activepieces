import { createAction, Property } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { ISSUE_FIELDS, dropdownError, flattenIssue, resolveProject } from '../common';
import { youtrackClient, YoutrackCapError } from '../common/client';
import { searchIssuesActionOutputSchema } from '../output-schemas';

export const searchIssuesAction = createAction({
  auth: youtrackAuth,
  name: 'search_issues',
  classification: 'SEARCH',
  outputSchema: searchIssuesActionOutputSchema,
  displayName: 'Search Issues',
  description: 'Searches for issues using YouTrack query syntax. Returns flat rows for spreadsheets.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search issues using YouTrack query syntax (e.g. "#unresolved", "assignee: me", "Priority: Critical"), optionally scoped to one project given by short name (like "APT") or project ID (like "0-5"). Leave both the project and query empty to list all accessible issues. Limit (default 100) caps the rows; use Skip to read further. Use to find issues before acting on them. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    project: Property.Dropdown({
      auth: youtrackAuth,
      displayName: 'Project',
      description: 'Optional: filter by project. Leave empty to search across all projects. You can also map a project short name or ID from List Projects.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        try {
          const projects = await youtrackClient.listAll({
            auth,
            path: '/admin/projects',
            query: { fields: 'id,name,shortName' },
            maxItems: 2000,
            operation: 'list projects',
          });
          return {
            disabled: false,
            options: [
              { label: '[All projects]', value: '' },
              ...projects.map((p) => ({
                label: `${String(p['name'] ?? '')} (${String(p['shortName'] ?? '')})`,
                value: String(p['shortName'] ?? ''),
              })),
            ],
          };
        } catch (error) {
          if (error instanceof YoutrackCapError) {
            return { disabled: false, options: [{ label: '[All projects]', value: '' }], placeholder: 'Too many projects to list: map the project short name instead.' };
          }
          return dropdownError({ prefix: 'Failed to load projects', error });
        }
      },
    }),
    query: Property.LongText({
      displayName: 'Search Query',
      description: 'YouTrack search query. Examples:\n' +
        '- #unresolved — all unresolved issues\n' +
        '- assignee: me — assigned to you\n' +
        '- Priority: Critical — critical priority\n' +
        '- created: this week — created this week\n' +
        '- summary: login — issues mentioning "login"',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum issues to return. Default is 100.',
      required: false,
      defaultValue: 100,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of matching issues to skip, for reading the next page. Default 0.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth;
    const queryParts: string[] = [];
    const project = youtrackClient.optionalText(context.propsValue.project);
    if (project !== undefined) {
      const shortName = youtrackClient.isDatabaseId(project) ? (await resolveProject({ auth, value: project })).shortName : project;
      queryParts.push('project: {' + shortName + '}');
    }
    const query = youtrackClient.optionalText(context.propsValue.query);
    if (query !== undefined) queryParts.push(query);
    const items = await youtrackClient.listUpTo({
      auth,
      path: '/issues',
      query: { fields: ISSUE_FIELDS, query: queryParts.length > 0 ? queryParts.join(' ') : undefined },
      limit: context.propsValue.limit,
      fallback: 100,
      skip: context.propsValue.skip,
      operation: 'search issues',
    });
    return items.map((item) => flattenIssue(item));
  },
});
