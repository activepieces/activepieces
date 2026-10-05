import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyProps } from '../common';
import { NiftyAuth, niftyClient, NiftyRecord } from '../common/client';
import { niftyPolling, TimeCursor } from '../common/polling';
import { taskOutputSchema } from '../output-schemas';
import { TASK_SAMPLE } from './sample-data';

export const newTask = createTrigger({
  auth: niftyAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a task is created, in one project or in any project you can see.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once per newly created Nifty task, either in one chosen project or across every project the connection can see; subtasks are only seen when a project is chosen. Polls the task list and remembers the newest creation time, so tasks created while the flow was off are not replayed.',
  },
  props: {
    portfolio: niftyProps.portfolio({ required: false }),
    project: niftyProps.project({
      required: false,
      description: 'Optional. Leave empty to watch every project (subtasks are then not included).',
    }),
    include_subtasks: Property.Checkbox({
      displayName: 'Include Subtasks',
      description: 'Also trigger for new subtasks. Only works when a project is selected.',
      required: false,
      defaultValue: true,
    }),
  },
  outputSchema: taskOutputSchema,
  sampleData: TASK_SAMPLE,
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    if (context.isRepublish && (await context.store.get<TimeCursor>(CURSOR_KEY))) {
      return;
    }
    await context.store.put(CURSOR_KEY, await seed({ auth: context.auth, propsValue: context.propsValue }));
  },
  async onDisable(context) {
    await context.store.delete(CURSOR_KEY);
  },
  async test(context) {
    const tasks = await loadTasks({ auth: context.auth, propsValue: context.propsValue });
    return [...tasks].sort((a, b) => Date.parse(createdAt(b)) - Date.parse(createdAt(a))).slice(0, 5);
  },
  async run(context) {
    const stored = await context.store.get<TimeCursor>(CURSOR_KEY);
    if (!stored) {
      await context.store.put(CURSOR_KEY, await seed({ auth: context.auth, propsValue: context.propsValue }));
      return [];
    }
    const tasks = await loadTasks({ auth: context.auth, propsValue: context.propsValue });
    const { emit, cursor } = niftyPolling.advanceTimeCursor({ cursor: stored, items: tasks, timeOf: createdAt, keyOf: idOf });
    await context.store.put(CURSOR_KEY, cursor);
    return emit;
  },
});

async function loadTasks({ auth, propsValue }: { auth: NiftyAuth; propsValue: TriggerProps }): Promise<NiftyRecord[]> {
  return niftyPolling.fetchTasks({
    auth,
    projectId: niftyClient.optionalId({ value: propsValue.project, label: 'Project' }),
    includeSubtasks: propsValue.include_subtasks !== false,
  });
}

async function seed({ auth, propsValue }: { auth: NiftyAuth; propsValue: TriggerProps }): Promise<TimeCursor> {
  const tasks = await loadTasks({ auth, propsValue });
  return niftyPolling.seedTimeCursor({ items: tasks, timeOf: createdAt, keyOf: idOf, now: new Date().toISOString() });
}

function createdAt(task: NiftyRecord): string {
  return niftyClient.text({ record: task, key: 'created_at' });
}

function idOf(task: NiftyRecord): string {
  return niftyClient.text({ record: task, key: 'id' });
}

const CURSOR_KEY = 'nifty_new_task_cursor';

type TriggerProps = { project?: string; include_subtasks?: boolean };
