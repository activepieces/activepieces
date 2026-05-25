import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';
import { freshserviceCommon, FreshserviceChangeTask } from '../common/props';

type Props = { change_id: number | undefined };

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof freshserviceAuth>,
  Props
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS, propsValue }) {
    if (!propsValue.change_id) return [];
    const response = await freshserviceApiCall<{
      tasks: FreshserviceChangeTask[];
    }>({
      method: HttpMethod.GET,
      endpoint: `changes/${propsValue.change_id}/tasks`,
      auth,
      queryParams: {
        order_by: 'updated_at',
        order_type: 'desc',
        per_page: lastFetchEpochMS === 0 ? '10' : '100',
      },
    });

    return response.body.tasks.map((task) => ({
      epochMilliSeconds: new Date(task.updated_at).getTime(),
      data: task,
    }));
  },
};

export const updatedChangeTask = createTrigger({
  auth: freshserviceAuth,
  name: 'updated_change_task',
  displayName: 'Updated Change Task',
  description: 'Triggers when a task on a specific change request is updated. Note: newly created tasks may also fire this trigger because their updated_at matches created_at.',
  props: {
    change_id: freshserviceCommon.change(true),
  },
  sampleData: {
    id: 1,
    title: 'Review change impact',
    description: 'Assess the blast radius before proceeding.',
    status: 2,
    agent_id: 5,
    group_id: 1,
    due_date: '2025-01-20T17:00:00Z',
    notify_before: 0,
    created_at: '2025-01-15T09:30:00Z',
    updated_at: '2025-01-15T11:45:00Z',
  },
  type: TriggerStrategy.POLLING,

  async test(context) {
    return await pollingHelper.test(polling, context);
  },

  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
