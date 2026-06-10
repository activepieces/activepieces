import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
  StaticPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
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

const props = {
  type: Property.StaticDropdown({
    displayName: 'Objective Level',
    description:
      'Only trigger for objectives at a specific level. Leave empty to receive objectives from all levels.',
    required: false,
    options: {
      options: [
        { label: 'Company', value: 'company' },
        { label: 'Department', value: 'department' },
        { label: 'Team', value: 'team' },
        { label: 'Personal (User)', value: 'user' },
      ],
    },
  }),
  period: Property.ShortText({
    displayName: 'Quarter',
    description:
      'Only trigger for objectives in a specific quarter. Use YYYYQ format (e.g. "2024Q1") or a full year (e.g. "2024"). Leave empty to watch all periods.',
    required: false,
  }),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof weekdoneAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const token = auth.access_token;
    const queryParams: Record<string, string> = {};

    if (propsValue.type) queryParams['type'] = propsValue.type;
    if (propsValue.period) queryParams['period'] = propsValue.period;

    const response = await httpClient.sendRequest<{
      status: string;
      data: WeekdoneObjective[];
    }>({
      method: HttpMethod.GET,
      url: `https://api.weekdone.com/1/objective?token=${token}`,
      queryParams,
    });

    const objectives = response.body.data ?? [];
    return objectives
      .sort((a, b) => b.id - a.id)
      .map((obj) => ({
      id: obj.id,
      data: {
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
      },
    }));
  },
};

export const newObjectiveTrigger = createTrigger({
  auth: weekdoneAuth,
  name: 'new_objective',
  displayName: 'New Objective',
  description: 'Triggers when a new OKR objective is added in Weekdone.',
  props,
  sampleData: {
    id: 1,
    type: 'company',
    description: 'Grow revenue by 20% this quarter',
    period: '2024Q1',
    progress: 0,
    comment_count: 0,
    key_result_count: 0,
    department_id: null,
    team_id: null,
    user_id: null,
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
