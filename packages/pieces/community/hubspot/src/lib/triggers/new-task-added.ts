import {
  OAuth2PropertyValue,
  createTrigger,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { hubSpotClient } from '../common/client';
import dayjs from 'dayjs';
import { hubspotAuth } from '../..';

const polling: Polling<OAuth2PropertyValue, unknown> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const currentValues =
      (
        await hubSpotClient.tasks.getTasksAfterLastSearch(
          auth.access_token,
          lastFetchEpochMS
        )
      ).results ?? [];
    const items = currentValues.map((item: { createdAt: string }) => ({
      epochMilliSeconds: dayjs(item.createdAt).valueOf(),
      data: item,
    }));
    return items;
  },
};

export const newTaskAdded = createTrigger({
  auth: hubspotAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Trigger when a new task is added.',
  props: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  sampleData: {
    results: [
      {
        id: '18156543966',
        properties: {
          hs_created_by: '5605286',
          hs_created_by_user_id: '5605286',
          hs_createdate: '2023-06-13T09:42:37.557Z',
          hs_modified_by: '5605286',
          hs_num_associated_companies: '0',
          hs_num_associated_contacts: '1',
          hs_num_associated_deals: '0',
          hs_num_associated_tickets: '0',
          hs_product_name: null,
          hs_read_only: null,
          hs_repeat_status: null,
          hs_task_body: null,
          hs_task_completion_count: '0',
          hs_task_completion_date: null,
          hs_task_is_all_day: 'false',
          hs_task_is_completed: '0',
          hs_task_is_completed_call: '0',
          hs_task_is_completed_email: '0',
          hs_task_is_completed_linked_in: '0',
          hs_task_is_completed_sequence: '0',
          hs_task_repeat_interval: null,
          hs_task_status: 'NOT_STARTED',
          hs_task_subject: 'My Test Task',
          hs_task_type: 'TODO',
          hs_updated_by_user_id: '5605286',
          hubspot_owner_id: '1041576162',
          hs_timestamp: '2023-06-16T05:00:00Z',
        },
        createdAt: '2023-06-13T09:42:37.557Z',
        updatedAt: '2023-06-13T10:03:41.073Z',
        archived: false,
      },
    ],
  },
});
