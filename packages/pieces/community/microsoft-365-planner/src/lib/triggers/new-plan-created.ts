import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { microsoft365PlannerAuth } from '../auth';
import { microsoft365PlannerApi } from '../common/api';
import { microsoft365PlannerPlanOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof microsoft365PlannerAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const items = await microsoft365PlannerApi.listPlans({
      auth,
    });
    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.createdDateTime).valueOf(),
      data: item,
    }));
  },
};

export const newPlanCreatedTrigger = createTrigger({
  auth: microsoft365PlannerAuth,
  name: 'newPlanCreated',
  outputSchema: microsoft365PlannerPlanOutputSchema,
  classification: 'READ',
  displayName: 'New Plan Created',
  description: 'Triggers when a new Plan is created in Microsoft 365 Planner.',
  aiMetadata: {
    description: 'Fires when a new plan is created in Microsoft 365 Planner across the authenticated user\'s accessible plans. Polls periodically and emits each newly created plan.',
  },
  props: {},
  sampleData: {},
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
