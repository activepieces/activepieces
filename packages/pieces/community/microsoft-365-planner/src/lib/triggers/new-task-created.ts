import {
    DedupeStrategy,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    createTrigger,
    PiecePropValueSchema,
    StaticPropsValue,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '../common';
import { PlanDropdown } from '../common/properties';

const props = {
  planId: PlanDropdown({ required: true }),
};

const polling: Polling<
  PiecePropValueSchema<typeof microsoft365PlannerAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue: { planId } }) => {
    if (!planId) {
      return [];
    }
    const items = await microsoft365PlannerCommon.listTasks({
      auth,
      planId,
    });
    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.createdDateTime).valueOf(),
      data: item,
    }));
  },
};

export const newTaskCreated = createTrigger({
  auth: microsoft365PlannerAuth,
  name: 'newTaskCreated',
  displayName: 'New Task Created',
  description: 'Triggers when a new Task is created in Microsoft 365 Planner.',
  props,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
