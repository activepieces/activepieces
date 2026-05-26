import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { weekdoneAuth } from '../auth';
import { weekdoneCommon } from '../common';

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

export const createObjectiveAction = createAction({
  auth: weekdoneAuth,
  name: 'create_objective',
  displayName: 'Create New Objective',
  description: 'Creates a new OKR objective in Weekdone.',
  props: {
    description: Property.LongText({
      displayName: 'Description',
      description: 'The text of the objective (e.g. "Grow revenue by 20% this quarter").',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Objective Level',
      description:
        'The level this objective applies to. Company objectives apply to the whole organisation; Department, Team, and Personal are scoped to a specific group or individual.',
      required: true,
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
    level_details: Property.DynamicProperties({
      auth: weekdoneAuth,
      displayName: 'Level Details',
      description: 'Additional fields required for the selected objective level.',
      required: true,
      refreshers: ['type'],
      props: async ({ auth, type }): Promise<DynamicPropsValue> => {
        if (type === 'department') {
          return {
            department_id: Property.Number({
              displayName: 'Department ID',
              description:
                'The numeric ID of the department. You can find this in your Weekdone organisation settings.',
              required: true,
            }),
          };
        }
        if (type === 'team') {
          const token = (auth as { access_token: string }).access_token;
          const teams = await weekdoneCommon.fetchTeams({ token });
          return {
            team_id: Property.StaticDropdown({
              displayName: 'Team',
              description: 'The team this objective belongs to.',
              required: true,
              options: { options: teams.map((t) => ({ label: t.name, value: t.id })) },
            }),
          };
        }
        if (type === 'user') {
          const token = (auth as { access_token: string }).access_token;
          const [teams, users] = await Promise.all([
            weekdoneCommon.fetchTeams({ token }),
            weekdoneCommon.fetchUsers({ token }),
          ]);
          return {
            team_id: Property.StaticDropdown({
              displayName: 'Team',
              description: "The user's primary team.",
              required: true,
              options: { options: teams.map((t) => ({ label: t.name, value: t.id })) },
            }),
            user_id: Property.StaticDropdown({
              displayName: 'User',
              description: 'The user this objective belongs to.',
              required: true,
              options: { options: users.map((u) => ({ label: u.name, value: u.id })) },
            }),
          };
        }
        return {};
      },
    }),
    period: Property.ShortText({
      displayName: 'Quarter',
      description:
        'The quarter this objective belongs to in YYYYQ format (e.g. "2024Q1" for Q1 2024, "2024Q3" for Q3 2024). Leave empty to use the current quarter.',
      required: false,
    }),
  },
  async run(context) {
    const { description, type, level_details, period } = context.propsValue;
    const token = context.auth.access_token;

    const body: Record<string, unknown> = { description, type };

    if (period) body['period'] = period;

    if (type === 'department' && level_details) {
      body['department_id'] = level_details['department_id'];
    } else if (type === 'team' && level_details) {
      body['team_id'] = level_details['team_id'];
    } else if (type === 'user' && level_details) {
      body['team_id'] = level_details['team_id'];
      body['user_id'] = level_details['user_id'];
    }

    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.POST,
      url: `https://api.weekdone.com/1/objective?token=${token}`,
      body,
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
