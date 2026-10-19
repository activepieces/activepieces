import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyProps } from '../common';
import { NiftyAuth, niftyClient, NiftyRecord } from '../common/client';
import { niftyPolling, TimeState } from '../common/polling';
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
    const { items } = await fetchCompleted({ auth: context.auth, propsValue: context.propsValue, window: undefined });
    return [...items].sort((a, b) => Date.parse(completedOn(b)) - Date.parse(completedOn(a))).slice(0, 5);
  },
  async run(context) {
    const fp = fingerprintOf({ propsValue: context.propsValue });
    const stored = niftyPolling.readTimeState({ value: await context.store.get<unknown>(CURSOR_KEY), fp });
    if (!stored) {
      await context.store.put(CURSOR_KEY, await seed({ auth: context.auth, propsValue: context.propsValue }));
      return [];
    }
    const scan = await niftyPolling.readWindow({
      from: stored.cp,
      to: new Date(Date.now() + WINDOW_AHEAD_MS).toISOString(),
      fetchWindow: (window) => fetchCompleted({ auth: context.auth, propsValue: context.propsValue, window }),
    });
    const { emit, cursor } = niftyPolling.advanceTimeCursor({ cursor: stored, items: scan.items, timeOf: completedOn, keyOf: completionKey });
    const next = scan.narrowed ? niftyPolling.coverScannedWindow({ cursor, scannedTo: scan.scannedTo }) : cursor;
    await context.store.put(CURSOR_KEY, { ...next, fp });
    return emit;
  },
});

async function fetchCompleted({
  auth,
  propsValue,
  window,
}: {
  auth: NiftyAuth;
  propsValue: TriggerProps;
  window: { from: string; to: string } | undefined;
}): Promise<{ items: NiftyRecord[]; truncated: boolean }> {
  const range = window === undefined ? {} : { completed_from: window.from, completed_to: window.to };
  const { items, truncated } = await niftyPolling.fetchTasks({
    auth,
    projectId: projectIdOf({ propsValue }),
    includeSubtasks: propsValue.include_subtasks !== false,
    extraQuery: { completed: true, order: 'completedOn:DESC', ...range },
  });
  return { items: items.filter((task) => task['completed'] === true), truncated };
}

async function seed({ auth, propsValue }: { auth: NiftyAuth; propsValue: TriggerProps }): Promise<TimeState> {
  const { items } = await fetchCompleted({ auth, propsValue, window: undefined });
  const cursor = niftyPolling.seedTimeCursor({ items, timeOf: completedOn, keyOf: completionKey, now: new Date().toISOString() });
  return { ...cursor, fp: fingerprintOf({ propsValue }) };
}

function projectIdOf({ propsValue }: { propsValue: TriggerProps }): string | undefined {
  return niftyClient.optionalId({ value: propsValue.project, label: 'Project' });
}

function fingerprintOf({ propsValue }: { propsValue: TriggerProps }): string {
  return niftyPolling.fingerprint({ values: [projectIdOf({ propsValue }) ?? null, propsValue.include_subtasks !== false] });
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
