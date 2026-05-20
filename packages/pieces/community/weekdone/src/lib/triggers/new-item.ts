import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { weekdoneAuth } from '../auth';
import { weekdoneCommon } from '../common';

type WeekdoneItem = {
  id: number;
  inserted: string;
  description: string;
  likecount: number;
  commentcount: number;
  type_id: number;
  team_id: number;
  user_id: number;
  priority: number;
  from_id: number | null;
  source: number;
  source_id: string | null;
  due_on: string | null;
  private: number;
  nr: number;
};

const props = {
  user_id: weekdoneCommon.userDropdown({
    displayName: 'Filter by User',
    description: 'Only trigger for items belonging to this user. Leave empty to receive items from all users.',
    required: false,
  }),
  team_id: weekdoneCommon.teamDropdown({
    displayName: 'Filter by Team',
    description: 'Only trigger for items added to this team. Leave empty to receive items from all teams.',
    required: false,
  }),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof weekdoneAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = auth.access_token;
    const queryParams: Record<string, string> = {};

    if (propsValue.user_id !== null && propsValue.user_id !== undefined) {
      queryParams['user_id'] = String(propsValue.user_id);
    }
    if (propsValue.team_id !== null && propsValue.team_id !== undefined) {
      queryParams['team_id'] = String(propsValue.team_id);
    }

    const response = await httpClient.sendRequest<{ status: string; items: WeekdoneItem[] }>({
      method: HttpMethod.GET,
      url: `https://api.weekdone.com/1/items?token=${token}`,
      queryParams,
    });

    const items = response.body.items ?? [];
    return items.map((item) => ({
      epochMilliSeconds: new Date(item.inserted).getTime(),
      data: {
        id: item.id,
        description: item.description,
        type_id: item.type_id,
        inserted: item.inserted,
        due_on: item.due_on ?? null,
        priority: item.priority,
        user_id: item.user_id,
        team_id: item.team_id,
        from_id: item.from_id ?? null,
        source: item.source,
        source_id: item.source_id ?? null,
        is_private: item.private,
        position: item.nr,
        like_count: item.likecount,
        comment_count: item.commentcount,
      },
    }));
  },
};

export const newItemTrigger = createTrigger({
  auth: weekdoneAuth,
  name: 'new_item',
  displayName: 'New Item',
  description: 'Triggers when a new item is added to a Weekdone report.',
  props,
  sampleData: {
    id: 690,
    description: 'Finished Q1 planning session',
    type_id: 2,
    inserted: '2024-01-15T09:00:00Z',
    due_on: null,
    priority: 1,
    user_id: 12,
    team_id: 3,
    from_id: null,
    source: 0,
    source_id: null,
    is_private: 0,
    position: 1,
    like_count: 0,
    comment_count: 0,
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
