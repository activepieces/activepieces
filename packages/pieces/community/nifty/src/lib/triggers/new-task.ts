import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyProps } from '../common';
import { NiftyAuth, niftyClient, NiftyRecord } from '../common/client';
import { niftyPolling, TimeState } from '../common/polling';
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
    const fp = fingerprintOf({ propsValue: context.propsValue });
    const stored = niftyPolling.readTimeState({ value: await context.store.get<unknown>(CURSOR_KEY), fp });
    if (context.isRepublish && stored) {
      return;
    }
    await context.store.put(CURSOR_KEY, await seed({ auth: context.auth, propsValue: context.propsValue }));
  },
  async onDisable() {
    return;
  },
  async test(context) {
    const { items } = await loadTasks({ auth: context.auth, propsValue: context.propsValue });
    return [...items].sort((a, b) => Date.parse(createdAt(b)) - Date.parse(createdAt(a))).slice(0, 5);
  },
  async run(context) {
    const fp = fingerprintOf({ propsValue: context.propsValue });
    const stored = niftyPolling.readTimeState({ value: await context.store.get<unknown>(CURSOR_KEY), fp });
    if (!stored) {
      await context.store.put(CURSOR_KEY, await seed({ auth: context.auth, propsValue: context.propsValue }));
      return [];
    }
    const { items } = await loadTasks({ auth: context.auth, propsValue: context.propsValue });
    const { emit, cursor } = niftyPolling.advanceTimeCursor({ cursor: stored, items, timeOf: createdAt, keyOf: idOf });
    await context.store.put(CURSOR_KEY, { ...cursor, fp });
    return emit;
  },
});

async function loadTasks({ auth, propsValue }: { auth: NiftyAuth; propsValue: TriggerProps }): Promise<{ items: NiftyRecord[]; truncated: boolean }> {
  return niftyPolling.fetchTasks({
    auth,
    projectId: projectIdOf({ propsValue }),
    includeSubtasks: propsValue.include_subtasks !== false,
  });
}

async function seed({ auth, propsValue }: { auth: NiftyAuth; propsValue: TriggerProps }): Promise<TimeState> {
  const { items } = await loadTasks({ auth, propsValue });
  const cursor = niftyPolling.seedTimeCursor({ items, timeOf: createdAt, keyOf: idOf, now: new Date().toISOString() });
  return { ...cursor, fp: fingerprintOf({ propsValue }) };
}

function projectIdOf({ propsValue }: { propsValue: TriggerProps }): string | undefined {
  return niftyClient.optionalId({ value: propsValue.project, label: 'Project' });
}

function fingerprintOf({ propsValue }: { propsValue: TriggerProps }): string {
  return niftyPolling.fingerprint({ values: [projectIdOf({ propsValue }) ?? null, propsValue.include_subtasks !== false] });
}

function createdAt(task: NiftyRecord): string {
  return niftyClient.text({ record: task, key: 'created_at' });
}

function idOf(task: NiftyRecord): string {
  return niftyClient.text({ record: task, key: 'id' });
}

const CURSOR_KEY = 'nifty_new_task_cursor';

type TriggerProps = { project?: string; include_subtasks?: boolean };
