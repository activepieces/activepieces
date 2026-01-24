import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { meistertaskAuth } from '../../index';
import { makeRequest, meisterTaskCommon } from '../common/common';

const getToken = (auth: any): string => {
  return typeof auth === 'string' ? auth : (auth as any).access_token;
};

const newChecklistItemPolling: Polling<
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  { task_id: unknown }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const token = getToken(auth);

    try {
      const tasksResponse = await makeRequest(
        HttpMethod.GET,
        `/task/${propsValue.task_id}/checklist_items`,
        token
      );

      const tasks = tasksResponse.body || [];
      const checklistItems: any[] = [];

      if (tasks.length === 0) {
        return [];
      }

      return tasks.map((item: any) => ({
        id: item.id,
        data: item,
      }));
    } catch (error) {
      console.error('Error fetching checklist items:', error);
      return [];
    }
  },
};

export const newChecklistItem = createTrigger({
  auth: meistertaskAuth,
  name: 'new_checklist_item',
  displayName: 'New Checklist Item',
  description: 'Triggers when a new checklist item is added to a task.',
  props: {
    task_id: meisterTaskCommon.task_id,
  },
  sampleData: {
    "id": 26,
    "name": "Checklist A",
    "sequence": 100000,
    "task_id": 12,
    "project_id": 6
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