import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { weekdoneAuth } from '../auth';

type WeekdoneObjective = {
  id: number;
  type: string;
  description: string;
  period: string;
  comments: number | unknown[];
  progress: number;
  results: unknown[];
  parent_list: unknown[];
  department_id?: number;
  team_id?: number;
  user_id?: number;
};

export const updateObjectiveAction = createAction({
  auth: weekdoneAuth,
  name: 'update_objective',
  displayName: 'Update Objective',
  description: 'Updates the description of an existing OKR objective in Weekdone.',
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Filter by Level',
      description: 'Narrow the objective list by level to make it easier to find the one you want.',
      required: false,
      defaultValue: 'company',
      options: {
        options: [
          { label: 'Company', value: 'company' },
          { label: 'Department', value: 'department' },
          { label: 'Team', value: 'team' },
          { label: 'Personal (User)', value: 'user' },
        ],
      },
    }),
    search_period: Property.ShortText({
      displayName: 'Filter by Quarter',
      description:
        'Narrow the objective list by quarter in YYYYQ format (e.g. "2024Q1"). Leave empty to show objectives from all periods.',
      required: false,
    }),
    objective_id: Property.Dropdown({
      displayName: 'Objective',
      description:
        'The objective to update. Use "Filter by Level" and "Filter by Quarter" above to narrow the list.',
      required: true,
      auth: weekdoneAuth,
      refreshers: ['search_type', 'search_period'],
      options: async ({ auth, search_type, search_period }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
        }
        const token = (auth as { access_token: string }).access_token;
        const queryParams: Record<string, string> = {};
        if (search_type) queryParams['type'] = search_type as string;
        if (search_period) queryParams['period'] = search_period as string;

        try {
          const response = await httpClient.sendRequest<{
            status: string;
            data: WeekdoneObjective[];
          }>({
            method: HttpMethod.GET,
            url: `https://api.weekdone.com/1/objective?token=${token}`,
            queryParams,
          });
          const objectives = response.body.data ?? [];
          if (objectives.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No objectives found. Try different filters.',
            };
          }
          return {
            disabled: false,
            options: objectives.map((obj) => ({
              label: `${obj.description} (${obj.period ?? 'no period'})`,
              value: obj.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load objectives. Check your connection.',
          };
        }
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The new text for the objective.',
      required: true,
    }),
  },
  async run(context) {
    const { objective_id, description } = context.propsValue;
    const token = context.auth.access_token;

    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.PATCH,
      url: `https://api.weekdone.com/1/objective/${objective_id}?token=${token}`,
      body: { description },
    });

    const obj = (response.body['data'] ?? response.body['objective'] ?? response.body) as WeekdoneObjective;
    return {
      id: obj.id,
      type: obj.type,
      description: obj.description,
      period: obj.period,
      progress: obj.progress,
      comment_count: Array.isArray(obj.comments) ? obj.comments.length : (obj.comments ?? 0),
      key_result_count: Array.isArray(obj.results) ? obj.results.length : 0,
      department_id: obj.department_id ?? null,
      team_id: obj.team_id ?? null,
      user_id: obj.user_id ?? null,
    };
  },
});
