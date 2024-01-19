import {
  OAuth2PropertyValue,
  OAuth2Props,
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { googleTasksAuth } from '../..';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { getTasks, googleTasksCommon } from '../common';

const props = {
  tasks_list: googleTasksCommon.tasksList,
};

const polling: Polling<
  OAuth2PropertyValue<OAuth2Props>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const records = await getTasks(auth, propsValue.tasks_list!);

    const filtered_records = records.filter((record) => {
      const updated = Date.parse(record.updated);
      return updated > lastFetchEpochMS;
    });

    return filtered_records.map((record) => ({
      epochMilliSeconds: Date.parse(record.updated),
      data: record,
    }));
  },
};

export const newTaskTrigger = createTrigger({
  auth: googleTasksAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a task is created',
  type: TriggerStrategy.POLLING,
  props,
  sampleData: {},
  async test(context) {
    const store = context.store;
    const auth = context.auth as OAuth2PropertyValue<OAuth2Props>;
    const propsValue = context.propsValue;
    return await pollingHelper.test(polling, { store, auth, propsValue });
  },
  async onEnable(context) {
    const store = context.store;
    const auth = context.auth as OAuth2PropertyValue<OAuth2Props>;
    const propsValue = context.propsValue;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const store = context.store;
    const auth = context.auth as OAuth2PropertyValue<OAuth2Props>;
    const propsValue = context.propsValue;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async run(context) {
    const store = context.store;
    const auth = context.auth as OAuth2PropertyValue<OAuth2Props>;
    const propsValue = context.propsValue;
    return await pollingHelper.poll(polling, { store, auth, propsValue });
  },
});
