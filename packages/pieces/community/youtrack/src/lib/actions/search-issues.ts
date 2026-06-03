import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { ISSUE_FIELDS, flattenObject, youtrackApiCall } from '../common';

export const searchIssuesAction = createAction({
  auth: youtrackAuth,
  name: 'search_issues',
  displayName: 'Search Issues',
  description: 'Searches for issues using YouTrack query syntax. Returns flat rows for spreadsheets.',
  props: {
    project: Property.Dropdown({
      auth:youtrackAuth,
      displayName: 'Project',
      description: 'Optional: filter by project. Leave empty to search across all projects.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        const { baseUrl, apiToken } = auth as unknown as { baseUrl: string; apiToken: string };
        try {
          const response = await youtrackApiCall<Array<{ id: string; name: string; shortName: string }>>({
            baseUrl,
            token: apiToken,
            method: HttpMethod.GET,
            path: '/admin/projects',
            queryParams: { fields: 'id,name,shortName' },
          });
          return {
            disabled: false,
            options: [
              { label: '[All projects]', value: '' },
              ...response.body.map((p) => ({ label: p.name + ' (' + p.shortName + ')', value: p.shortName })),
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
    const { baseUrl, apiToken } = context.auth.props;
    const limit = context.propsValue.limit ?? 100;

    const queryParts: string[] = [];
    if (context.propsValue.project) queryParts.push('project: {' + context.propsValue.project + '}');
    if (context.propsValue.query) queryParts.push(context.propsValue.query);

    const queryParams: Record<string, string> = { fields: ISSUE_FIELDS, '$top': String(limit) };
    if (queryParts.length > 0) queryParams['query'] = queryParts.join(' ');

    const response = await youtrackApiCall<Array<Record<string, unknown>>>({
      baseUrl,
      token: apiToken,
      method: HttpMethod.GET,
      path: '/issues',
      queryParams,
    });
    return (response.body || []).map((item) => flattenObject(item));
  },
});
