import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { meistertaskAuth } from '../../index';
import { makeRequest, meisterTaskCommon } from '../common/common';

const getToken = (auth: any): string => {
  return typeof auth === 'string' ? auth : (auth as any).access_token;
};

const newChecklistItemPolling: Polling<
  PiecePropValueSchema<typeof meistertaskAuth>,
  { project: unknown; section: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getToken(auth);
    
    try {
      const tasksResponse = await makeRequest(
        HttpMethod.GET,
        `/sections/${propsValue.section}/tasks`,
        token
      );

      const tasks = tasksResponse.body || [];
      const checklistItems: any[] = [];

      for (const task of tasks.slice(0, 10)) { 
        try {
          const checklistResponse = await makeRequest(
            HttpMethod.GET,
            `/tasks/${task.id}/checklist_items`,
            token
          );
          
          if (checklistResponse.body && Array.isArray(checklistResponse.body)) {
            checklistItems.push(...checklistResponse.body.map((item: any) => ({
              ...item,
              task_id: task.id,
              task_name: task.name,
            })));
          }
        } catch (error: any) {
          if (error?.response?.status !== 404) {
            console.error(`Error fetching checklist items for task ${task.id}:`, error);
          }
        }
      }

      if (checklistItems.length === 0) {
        return [];
      }

      return checklistItems.map((item: any) => ({
        epochMilliSeconds: dayjs(item.created_at || item.updated_at || new Date()).valueOf(),
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
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
  },
  sampleData: {
    id: 33333333,
    task_id: 12345678,
    name: 'Review document',
    status: 0,
    created_at: '2024-01-15T14:00:00Z',
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