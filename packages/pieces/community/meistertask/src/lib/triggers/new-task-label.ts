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

const newTaskLabelPolling: Polling<
  PiecePropValueSchema<typeof meistertaskAuth>,
  {  task_id: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getToken(auth);
    
    try {
      const response = await makeRequest(
        HttpMethod.GET,
        `/tasks/${propsValue.task_id}/task_labels`,
        token
      );

      const labels = response.body || [];
      return labels.map((label: any) => ({
        epochMilliSeconds: dayjs(label.created_at || new Date()).valueOf(),
        data: label,
      }));
    } catch (error) {
      console.error('Error fetching task labels:', error);
      return [];
    }
  },
};

export const newTaskLabel = createTrigger({
  auth: meistertaskAuth,
  name: 'new_task_label',
  displayName: 'New Task Label',
  description: 'Triggers when a task label is created.',
  props: {
    task_id: Property.ShortText({
      displayName: 'task id',
      required: true
    })
  },
  sampleData: {
    id: 44444444,
    task_id: 12345678,
    name: 'High Priority',
    color: '#FF0000',
    created_at: '2024-01-15T13:00:00Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(newTaskLabelPolling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(newTaskLabelPolling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(newTaskLabelPolling, context);
  },
  async run(context) {
    return await pollingHelper.poll(newTaskLabelPolling, context);
  },
});