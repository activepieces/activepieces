import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyProps } from '../common';
import { NiftyAuth, niftyClient, NiftyRecord } from '../common/client';
import { niftyPolling, TimeCursor } from '../common/polling';
import { taskOutputSchema } from '../output-schemas';
import { COMPLETED_TASK_SAMPLE } from './sample-data';

export const taskCompleted = createTrigger({
  auth: niftyAuth,
  name: 'task_completed',
  displayName: 'Task Completed',
  description: 'Triggers when a task is marked complete.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once per Nifty task completion, in one chosen project or across every project the connection can see; subtasks are only seen when a project is chosen. A task that is reopened and completed again fires again. Completions that happened while the flow was off are not replayed.',
  },
  props: {
    portfolio: niftyProps.portfolio({ required: false }),
    project: niftyProps.project({
      required: false,
      description: 'Optional. Leave empty to watch every project (subtasks are then not included).',
    }),
    include_subtasks: Property.Checkbox({
      displayName: 'Include Subtasks',
      description: 'Also trigger for completed subtasks. Only works when a project is selected.',
      required: false,
      defaultValue: true,
    }),
  },
  outputSchema: taskOutputSchema,
  sampleData: COMPLETED_TASK_SAMPLE,
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
    const tasks = await fetchCompleted({ auth: context.auth, propsValue: context.propsValue, since: undefined });
    return [...tasks].sort((a, b) => Date.parse(completedOn(b)) - Date.parse(completedOn(a))).slice(0, 5);
  },
  async run(context) {
    const stored = await context.store.get<TimeCursor>(CURSOR_KEY);
    if (!stored) {
      await context.store.put(CURSOR_KEY, await seed({ auth: context.auth, propsValue: context.propsValue }));
      return [];
    }
    const tasks = await fetchCompleted({ auth: context.auth, propsValue: context.propsValue, since: stored.cp });
    const { emit, cursor } = niftyPolling.advanceTimeCursor({ cursor: stored, items: tasks, timeOf: completedOn, keyOf: completionKey });
    await context.store.put(CURSOR_KEY, cursor);
    return emit;
  },
});

async function fetchCompleted({
  auth,
  propsValue,
  since,
}: {
  auth: NiftyAuth;
  propsValue: TriggerProps;
  since: string | undefined;
}): Promise<NiftyRecord[]> {
  const window =
    since === undefined
      ? {}
      : {
          completed_from: since,
          completed_to: new Date(Date.now() + WINDOW_AHEAD_MS).toISOString(),
        };
  const tasks = await niftyPolling.fetchTasks({
    auth,
    projectId: niftyClient.optionalId({ value: propsValue.project, label: 'Project' }),
    includeSubtasks: propsValue.include_subtasks !== false,
    extraQuery: { completed: true, order: 'completedOn:DESC', ...window },
  });
  return tasks.filter((task) => task['completed'] === true);
}

async function seed({ auth, propsValue }: { auth: NiftyAuth; propsValue: TriggerProps }): Promise<TimeCursor> {
  const tasks = await fetchCompleted({ auth, propsValue, since: undefined });
  return niftyPolling.seedTimeCursor({ items: tasks, timeOf: completedOn, keyOf: completionKey, now: new Date().toISOString() });
}

function completedOn(task: NiftyRecord): string {
  return niftyClient.text({ record: task, key: 'completed_on' });
}

function completionKey(task: NiftyRecord): string {
  return `${niftyClient.text({ record: task, key: 'id' })}:${completedOn(task)}`;
}

const CURSOR_KEY = 'nifty_task_completed_cursor';
const WINDOW_AHEAD_MS = 24 * 60 * 60 * 1000;

type TriggerProps = { project?: string; include_subtasks?: boolean };
