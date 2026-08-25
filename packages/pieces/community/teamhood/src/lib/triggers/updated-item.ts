import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
  QueryParams,
} from '@activepieces/pieces-common';
import {
  boardIdDropdown,
  teamhoodApiCall,
  TeamhoodAuth,
  teamhoodAuth,
  TeamhoodItem,
  workspaceIdDropdown,
} from '../common';

const props = {
  workspaceId: workspaceIdDropdown(false),
  boardId: boardIdDropdown(false),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof teamhoodAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const queryParams: QueryParams = {};
    if (propsValue.workspaceId)
      queryParams['WorkspaceId'] = propsValue.workspaceId;
    if (propsValue.boardId) queryParams['BoardId'] = propsValue.boardId;
    if (lastFetchEpochMS && lastFetchEpochMS > 0) {
      queryParams['ModifiedSince'] = new Date(lastFetchEpochMS).toISOString();
    }

    const response = await teamhoodApiCall<{ items?: TeamhoodItem[] }>({
      auth: auth.props as TeamhoodAuth,
      method: HttpMethod.GET,
      path: '/items',
      queryParams,
    });
    const items = response.body.items ?? [];
    return items.map((item) => ({
      epochMilliSeconds: new Date(item.modifiedDate).getTime(),
      data: item,
    }));
  },
};

export const updatedItemTrigger = createTrigger({
  auth: teamhoodAuth,
  name: 'updated_item',
  displayName: 'Updated Item',
  description: 'Fires when an existing Teamhood item is modified.',
  aiMetadata: {
    description:
      'Fires when an existing Teamhood item is modified, optionally scoped to a specific workspace and board. Each event represents one item whose details changed since the last poll.',
  },
  props,
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: '00000000-0000-0000-0000-000000000000',
    display_id: 'AP-1',
    workspace_id: '00000000-0000-0000-0000-000000000000',
    board_id: '00000000-0000-0000-0000-000000000000',
    row_id: '00000000-0000-0000-0000-000000000000',
    title: 'Updated task',
    status_id: null,
    owner_id: null,
    assigned_user_id: null,
    color: 0,
    start_date: null,
    due_date: null,
    is_schedule_locked: false,
    completed_on: null,
    description: null,
    budget: null,
    estimation: null,
    estimation_type: null,
    completed: false,
    archived: false,
    modified_date: '2026-01-01T00:00:00Z',
    created_date: '2026-01-01T00:00:00Z',
    archived_date: null,
    total_logged_time: 0,
    milestone: false,
    progress: null,
    is_suspended: false,
    suspend_reason: null,
    parent_id: null,
    tags: null,
    url: 'https://app.teamhood.com/items/0',
    has_attachments: false,
    duration: null,
    sort_order: 1,
  },
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
