import {
    DedupeStrategy,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    AppConnectionValueForAuthProperty,
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
  AppConnectionValueForAuthProperty<typeof microsoft365PlannerAuth>,
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
  sampleData: {
    '@odata.etag': 'W/"JzEtVGFzayAgQEBAffEBAQEBAQEBARCc="',
    planId: 's58lztas2UyCXSffEjnlVRgWUAFMLw',
    bucketId: 'xZ2RCz88uE6BffffftN-0TKffPGUAB-pQ',
    title: 'test task 123',
    orderHint: '8584411578775238762',
    assigneePriority: '',
    percentComplete: 0,
    startDateTime: null,
    createdDateTime: '2025-10-14T13:36:47.953708Z',
    dueDateTime: null,
    hasDescription: false,
    previewType: 'automatic',
    completedDateTime: null,
    referenceCount: 0,
    checklistItemCount: 0,
    activeChecklistItemCount: 0,
    conversationThreadId: null,
    priority: 5,
    id: 'wvG9lNxhuUO2JuedF9-rimUAFsBA',
    completedBy: null,
    createdBy: {
      user: {
        displayName: null,
        id: '90b3720d-f459-42c1-a02e-6471a1ecb068',
      },
      application: {
        displayName: null,
        id: '5ea0744c-62fa-4a19-99be-99f0869d3182',
      },
    },
    appliedCategories: {},
    assignments: {},
  },
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
