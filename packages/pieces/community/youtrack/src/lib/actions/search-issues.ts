// Action: Search Issues
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { ISSUE_FIELDS, flattenObject } from '../common';

export const searchIssuesAction = createAction({
  auth: youtrackAuth,
  name: 'search_issues',
  displayName: 'Search Issues',
  description: 'Searches for issues using YouTrack query syntax. Returns flat rows for spreadsheets.',
  props: {
    project: Property.Dropdown({
      displayName: 'Project',
      description: 'Optional: filter by project. Leave empty to search across all projects.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        const a = auth as unknown as { baseUrl: string; apiToken: string };
        try {
          const r = await fetch(a.baseUrl.replace(/\/+$/, '') + '/api/admin/projects?fields=id,name,shortName', {
            headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken },
          });
          const projects = await r.json() as Array<{ id: string; name: string; shortName: string }>;
          if (!r.ok) throw new Error(JSON.stringify(projects));
          return {
            disabled: false,
            options: [
              { label: '[All projects]', value: '' },
              ...projects.map((p) => ({ label: p.name + ' (' + p.shortName + ')', value: p.shortName })),
            ],
          };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load projects.' };
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
  },
  async run(context) {
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const limit = context.propsValue.limit ?? 100;

    const parts: string[] = [];
    if (context.propsValue.project) {
      parts.push('project: {' + context.propsValue.project + '}');
    }
    if (context.propsValue.query) {
      parts.push(context.propsValue.query);
    }
    const q = parts.length > 0 ? encodeURIComponent(parts.join(' ')) : '';

    const url = a.baseUrl.replace(/\/+$/, '') + '/api/issues?fields=' +
      encodeURIComponent(ISSUE_FIELDS) + '&query=' + q + '&$top=' + limit;
    const r = await fetch(url, {
      method: HttpMethod.GET,
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken },
    });
    const data = await r.json() as Array<Record<string, unknown>>;
    if (!r.ok) throw new Error('Failed to search: ' + JSON.stringify(data));
    return (data || []).map(flattenObject);
  },
  sampleData: [
    { idReadable: 'SP-42', summary: 'Fix login page crash', project_name: 'Sample Project', reporter_name: 'Jane Doe', created: 1644916724088 },
  ],
});
