import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { meistertaskAuth, getAccessToken } from '../auth';
import { makeRequest, meisterTaskCommon } from '../common/common';

const newChecklistItemPolling: Polling<
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  { task_id: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getAccessToken(auth);
    const tasksResponse = await makeRequest(
      HttpMethod.GET,
      `/tasks/${propsValue.task_id}/checklist_items`,
      token
    );

    const checklistItems = Array.isArray(tasksResponse.body) ? tasksResponse.body : [];

    return checklistItems.map((item: any) => ({
      epochMilliSeconds: dayjs(item.created_at).valueOf(),
      data: item,
    }));
  },
};

export const newChecklistItem = createTrigger({
  auth: meistertaskAuth,
  name: 'new_checklist_item',
  displayName: 'New Checklist Item',
  description: 'Triggers when a new checklist item is created.',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
    task_id: meisterTaskCommon.task_id,
  },
  sampleData: {
    "id": 1,
    "task_id": 15,
    "name": "Checklist Item",
    "created_at": "2023-01-01T00:00:00.000Z"
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(newChecklistItemPolling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(newChecklistItemPolling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(newChecklistItemPolling, context);
  },
  async run(context) {
    return await pollingHelper.poll(newChecklistItemPolling, context);
  },
});
