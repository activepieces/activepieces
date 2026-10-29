import {
  AppConnectionValueForAuthProperty,
  MarkdownVariant,
  Property,
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { googleTasksAuth } from '../auth';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { getAllTasks, googleTasksCommon } from '../common';
import { googleTasksNewTaskTriggerOutputSchema } from '../output-schemas';

const props = {
  tasks_list: googleTasksCommon.tasksList,
  info: Property.MarkDown({
    value: 'Edits to a task fire this trigger again, so the same task can arrive more than once.',
    variant: MarkdownVariant.INFO,
  }),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof googleTasksAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const params: Record<string, string> =
      lastFetchEpochMS > 0
        ? { updatedMin: new Date(lastFetchEpochMS).toISOString() }
        : {};
    const records = await getAllTasks({
      auth,
      taskListId: propsValue.tasks_list,
      params,
    });

    const filtered_records = records.filter((record) => {
      const updated = Date.parse(record.updated ?? '0');
      return updated > lastFetchEpochMS;
    });

    return filtered_records.map((record) => ({
      epochMilliSeconds: Date.parse(record.updated ?? '0'),
      data: record,
    }));
  },
};

export const newTaskTrigger = createTrigger({
  auth: googleTasksAuth,
  name: 'new_task',
  classification: 'READ',
  displayName: 'New Task',
  description: 'Triggers when a task is added or edited in a list.',
  aiMetadata: {
    description: 'Fires when a task in the selected Google Tasks list is newly created or updated since the last poll, emitting the task that changed. Use to react to additions or edits in a specific task list.',
  },
  type: TriggerStrategy.POLLING,
  props,
  propertyGroups: [
    {
      key: 'source',
      display: 'section',
      label: 'Watch',
      icon: 'inbox',
      props: ['tasks_list', 'info'],
    },
  ],
  outputSchema: googleTasksNewTaskTriggerOutputSchema,
  sampleData: {
    kind: 'tasks#task',
    id: 'MTIzNDU2Nzg5MDEyMzQ1Njc4OTA',
    etag: '"LTEyMzQ1Njc4OTA"',
    title: 'Call the dentist',
    updated: '2026-10-11T09:30:00.000Z',
    selfLink:
      'https://www.googleapis.com/tasks/v1/lists/MDEyMzQ1Njc4OTAxMjM0NTY3ODk/tasks/MTIzNDU2Nzg5MDEyMzQ1Njc4OTA',
    position: '00000000000000000000',
    notes: 'Ask about the cleaning appointment',
    status: 'needsAction',
    due: '2026-10-15T00:00:00.000Z',
    links: [],
    webViewLink: 'https://tasks.google.com/task/MTIzNDU2Nzg5MDEyMzQ1Njc4OTA',
  },
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
