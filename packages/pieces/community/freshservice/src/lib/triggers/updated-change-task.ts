import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceListPages } from '../common/client';
import { freshserviceSchemas } from '../common/schemas';
import { freshserviceCommon, FreshserviceChangeTask } from '../common/props';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof freshserviceAuth>,
  Props
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS, propsValue }) {
    if (propsValue.change_id === undefined || propsValue.change_id === null) {
      throw new Error('Select a change to watch for tasks.');
    }
    const records =
      lastFetchEpochMS === 0
        ? await freshserviceListPages<FreshserviceChangeTask>({
            auth,
            endpoint: `changes/${propsValue.change_id}/tasks`,
            key: 'tasks',
            perPage: 10,
            maxPages: 1,
            allowTruncation: true,
            queryParams: {},
          })
        : await freshserviceListPages<FreshserviceChangeTask>({
            auth,
            endpoint: `changes/${propsValue.change_id}/tasks`,
            key: 'tasks',
            queryParams: {},
          });
    return records.map((record) => ({
      epochMilliSeconds: new Date(record.updated_at).getTime(),
      data: record,
    }));
  },
};

export const updatedChangeTask = createTrigger({
  auth: freshserviceAuth,
  name: 'updated_change_task',
  classification: 'READ',
  outputSchema: freshserviceSchemas.task,
  displayName: 'Updated Change Task',
  description: 'Triggers when a task on a specific change request is updated. Note: newly created tasks may also fire this trigger because their updated_at matches created_at.',
  aiMetadata: {
    description: 'Fires when a task on one specific change request is modified in Freshservice (e.g. status, assignee, or due-date change), representing the latest state of that task. Scoped to a single change id chosen in setup; polls every page since the last check, by last-updated time, and note that newly created tasks can also fire this because their updated time initially equals their creation time.',
  },
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
    await pollingHelper.onEnable(polling, context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});

type Props = { change_id: number | undefined };
