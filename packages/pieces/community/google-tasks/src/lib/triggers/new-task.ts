import { createHash } from 'crypto';
import {
  MarkdownVariant,
  OAuth2PropertyValue,
  Property,
  Store,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { googleTasksAuth } from '../auth';
import { Task, getAllTasks, googleTasksCommon } from '../common';
import { googleTasksNewTaskTriggerOutputSchema } from '../output-schemas';

const RUN_ON_NEW_ONLY = 'new_only';
const RUN_ON_NEW_AND_EDITED = 'new_and_edited';
const STATE_KEY = 'new_task_state';
const LEGACY_CURSOR_KEY = 'lastPoll';
const STATE_VERSION = 1;
const OVERLAP_MS = 60_000;
const POLL_BUDGET_MS = 40_000;
const ENABLE_BUDGET_MS = 120_000;
const TEST_BUDGET_MS = 150_000;
const PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000;
const PRUNE_RETRY_MS = 60 * 60 * 1000;
const SEEN_CAP = 20_000;
const RECENT_CAP = 5_000;
const HASH_LENGTH = 8;
const RECENT_TIME_LENGTH = 9;
const RECENT_TIME_MAX = 36 ** RECENT_TIME_LENGTH - 1;
const SAMPLE_SIZE = 5;

export const newTaskTrigger = createTrigger({
  auth: googleTasksAuth,
  name: 'new_task',
  classification: 'READ',
  displayName: 'New Task',
  description:
    'Triggers when a task is added to a list, or also when one is edited if you choose New and edited tasks.',
  aiMetadata: {
    description:
      'Fires when a task is added to the selected Google Tasks list, emitting that task once (Run on = New tasks only, the default for new flows; edits, renames, moves within the list and completions do not fire it again). With Run on = New and edited tasks it also fires each time an existing task is edited, or completed through the API (tasks completed in the Google Tasks apps are hidden and do not fire), so the same task can be emitted several times. Use to react to new tasks in a specific list.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    tasks_list: googleTasksCommon.tasksList,
    run_on: Property.StaticDropdown<string, false>({
      displayName: 'Run on',
      description:
        'Whether edits run the flow again. Empty means "New and edited tasks".',
      required: false,
      defaultValue: RUN_ON_NEW_ONLY,
      options: {
        disabled: false,
        options: [
          { label: 'New tasks only', value: RUN_ON_NEW_ONLY },
          { label: 'New and edited tasks', value: RUN_ON_NEW_AND_EDITED },
        ],
      },
    }),
    info: Property.MarkDown({
      value:
        'With **New tasks only**, renaming, editing, moving or completing a task does not run the flow again; a task moved here from another list counts as new. With **New and edited tasks**, renaming or editing a task, or completing it through the API, runs the flow again, so the same task can arrive more than once; completing a task in the Google Tasks apps hides it and does not run the flow. Upgrading this piece to a new version in the builder pre-selects **New tasks only**; choose **New and edited tasks** to keep the old behaviour.',
      variant: MarkdownVariant.INFO,
    }),
  },
  propertyGroups: [
    {
      key: 'source',
      display: 'section',
      label: 'Watch',
      icon: 'inbox',
      props: ['tasks_list', 'run_on', 'info'],
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
    const mode = resolveRunOn({ value: context.propsValue.run_on });
    const { tasks, complete } = await getAllTasks({
      auth: context.auth,
      taskListId: context.propsValue.tasks_list,
      params: listParams({ mode }),
      deadlineMs: Date.now() + TEST_BUDGET_MS,
    });
    if (!complete) {
      throw new Error(
        'This task list is too large to load a sample in time, so the newest tasks could not be found. Try again.',
      );
    }
    return sortNewestFirst({ tasks: liveTasks({ tasks }) }).slice(0, SAMPLE_SIZE);
  },
  async onEnable(context) {
    const mode = resolveRunOn({ value: context.propsValue.run_on });
    const list = context.propsValue.tasks_list;
    const existing = context.isRepublish
      ? parseState({ raw: await context.store.get(STATE_KEY) })
      : null;
    if (existing && existing.mode === mode && existing.list === list) {
      return;
    }
    const lastPollMs =
      context.isRepublish && !existing
        ? legacyCursorMs({ raw: await context.store.get(LEGACY_CURSOR_KEY) })
        : null;
    if (lastPollMs !== null && mode === RUN_ON_NEW_AND_EDITED) {
      await context.store.put(STATE_KEY, legacyState({ list, lastPoll: lastPollMs }));
      await context.store.delete(LEGACY_CURSOR_KEY);
      return;
    }
    await context.store.put(
      STATE_KEY,
      await baselineState({
        auth: context.auth,
        list,
        mode,
        lastPollMs,
        deadlineMs: Date.now() + ENABLE_BUDGET_MS,
      }),
    );
    await context.store.delete(LEGACY_CURSOR_KEY);
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const mode = resolveRunOn({ value: context.propsValue.run_on });
    const list = context.propsValue.tasks_list;
    const state = await loadState({ store: context.store, list, mode });
    const deadlineMs = Date.now() + POLL_BUDGET_MS;
    if (!state) {
      const lastPollMs = legacyCursorMs({ raw: await context.store.get(LEGACY_CURSOR_KEY) });
      await context.store.put(
        STATE_KEY,
        await baselineState({ auth: context.auth, list, mode, lastPollMs, deadlineMs }),
      );
      await context.store.delete(LEGACY_CURSOR_KEY);
      return [];
    }
    if (state.pending) {
      await context.store.put(
        STATE_KEY,
        await continueBaseline({
          auth: context.auth,
          store: context.store,
          state,
          pending: state.pending,
          deadlineMs,
        }),
      );
      return [];
    }
    const scan: PollScan = state.scan ?? {
      pageToken: '',
      windowMinMs: Math.max(0, state.cursorMs - OVERLAP_MS),
      startedAtMs: Date.now(),
      maxUpdatedMs: state.cursorMs,
    };
    const listing = await listScanPage({
      auth: context.auth,
      store: context.store,
      state,
      scan,
      mode,
      deadlineMs,
    });
    const live = liveTasks({ tasks: listing.tasks });
    const maxUpdatedMs = maxUpdated({ fromMs: scan.maxUpdatedMs, tasks: live });
    const progress: ScanProgress = listing.complete
      ? {
          cursorMs: Math.max(state.cursorMs, Math.min(maxUpdatedMs, scan.startedAtMs)),
          scan: null,
        }
      : {
          cursorMs: state.cursorMs,
          scan: { ...scan, pageToken: listing.nextPageToken ?? scan.pageToken, maxUpdatedMs },
        };
    const next =
      mode === RUN_ON_NEW_ONLY
        ? await advanceNewOnly({ auth: context.auth, state, tasks: live, progress, deadlineMs })
        : advanceNewAndEdited({ state, tasks: live, progress, scanStartedAtMs: scan.startedAtMs });
    await context.store.put(STATE_KEY, next.state);
    return sortNewestFirst({ tasks: next.emitted });
  },
});

async function listScanPage({
  auth,
  store,
  state,
  scan,
  mode,
  deadlineMs,
}: {
  auth: OAuth2PropertyValue;
  store: Store;
  state: TriggerState;
  scan: PollScan;
  mode: RunOn;
  deadlineMs: number;
}): Promise<{ tasks: Task[]; complete: boolean; nextPageToken?: string }> {
  try {
    return await getAllTasks({
      auth,
      taskListId: state.list,
      params: {
        ...listParams({ mode }),
        updatedMin: new Date(scan.windowMinMs).toISOString(),
      },
      deadlineMs,
      startPageToken: scan.pageToken,
    });
  } catch (error) {
    if (scan.pageToken !== '' && error instanceof HttpError && error.response.status === 400) {
      await store.put(STATE_KEY, { ...state, scan: null });
    }
    throw error;
  }
}

async function loadState({
  store,
  list,
  mode,
}: {
  store: Store;
  list: string;
  mode: RunOn;
}): Promise<TriggerState | null> {
  const existing = parseState({ raw: await store.get(STATE_KEY) });
  if (existing) {
    return existing.mode === mode && existing.list === list ? existing : null;
  }
  const legacyCursor = await store.get(LEGACY_CURSOR_KEY);
  if (mode === RUN_ON_NEW_AND_EDITED && isFiniteNumber(legacyCursor)) {
    const migrated = legacyState({ list, lastPoll: legacyCursor });
    await store.put(STATE_KEY, migrated);
    await store.delete(LEGACY_CURSOR_KEY);
    return migrated;
  }
  return null;
}

async function baselineState({
  auth,
  list,
  mode,
  lastPollMs,
  deadlineMs,
}: {
  auth: OAuth2PropertyValue;
  list: string;
  mode: RunOn;
  lastPollMs: number | null;
  deadlineMs: number;
}): Promise<TriggerState> {
  const now = Date.now();
  if (mode === RUN_ON_NEW_AND_EDITED) {
    return {
      v: STATE_VERSION,
      mode,
      list,
      cursorMs: now,
      floorMs: now + 1,
      seen: '',
      recent: '',
      prunedAtMs: now,
      pending: null,
      scan: null,
    };
  }
  const { tasks, complete, nextPageToken } = await getAllTasks({
    auth,
    taskListId: list,
    params: listParams({ mode }),
    deadlineMs,
  });
  const startedAtMs = lastPollMs ?? now;
  return {
    v: STATE_VERSION,
    mode,
    list,
    cursorMs: startedAtMs,
    floorMs: 0,
    seen: mergeSeen({
      seen: '',
      tasks: updatedUntil({ tasks: liveTasks({ tasks }), untilMs: lastPollMs }),
    }),
    recent: '',
    prunedAtMs: now,
    pending: complete
      ? null
      : { pageToken: nextPageToken ?? '', startedAtMs, seenUntilMs: lastPollMs },
    scan: null,
  };
}

async function continueBaseline({
  auth,
  store,
  state,
  pending,
  deadlineMs,
}: {
  auth: OAuth2PropertyValue;
  store: Store;
  state: TriggerState;
  pending: PendingBaseline;
  deadlineMs: number;
}): Promise<TriggerState> {
  try {
    const { tasks, complete, nextPageToken } = await getAllTasks({
      auth,
      taskListId: state.list,
      params: listParams({ mode: RUN_ON_NEW_ONLY }),
      deadlineMs,
      startPageToken: pending.pageToken,
    });
    return {
      ...state,
      seen: mergeSeen({
        seen: state.seen,
        tasks: updatedUntil({ tasks: liveTasks({ tasks }), untilMs: pending.seenUntilMs }),
      }),
      cursorMs: complete ? pending.startedAtMs : state.cursorMs,
      pending: complete ? null : { ...pending, pageToken: nextPageToken ?? pending.pageToken },
    };
  } catch (error) {
    if (pending.pageToken !== '' && error instanceof HttpError && error.response.status === 400) {
      await store.put(STATE_KEY, { ...state, pending: { ...pending, pageToken: '' } });
    }
    throw error;
  }
}

function mergeSeen({ seen, tasks }: { seen: string; tasks: LiveTask[] }): string {
  const hashes = uniqueHashes({
    hashes: [...splitHashes({ seen }), ...tasks.map((task) => hashKey({ key: task.id }))],
  });
  return capSeen({ hashes }).join('');
}

function updatedUntil({
  tasks,
  untilMs,
}: {
  tasks: LiveTask[];
  untilMs: number | null;
}): LiveTask[] {
  if (untilMs === null) {
    return tasks;
  }
  return tasks.filter((task) => {
    const updatedMs = Date.parse(task.updated);
    return !Number.isFinite(updatedMs) || updatedMs <= untilMs;
  });
}

function legacyCursorMs({ raw }: { raw: unknown }): number | null {
  return isFiniteNumber(raw) ? raw : null;
}

function legacyState({ list, lastPoll }: { list: string; lastPoll: number }): TriggerState {
  return {
    v: STATE_VERSION,
    mode: RUN_ON_NEW_AND_EDITED,
    list,
    cursorMs: lastPoll,
    floorMs: lastPoll + 1,
    seen: '',
    recent: '',
    prunedAtMs: Date.now(),
    pending: null,
    scan: null,
  };
}

async function advanceNewOnly({
  auth,
  state,
  tasks,
  progress,
  deadlineMs,
}: {
  auth: OAuth2PropertyValue;
  state: TriggerState;
  tasks: LiveTask[];
  progress: ScanProgress;
  deadlineMs: number;
}): Promise<{ state: TriggerState; emitted: LiveTask[] }> {
  const seen = splitHashes({ seen: state.seen });
  const seenSet = new Set(seen);
  const emitted: LiveTask[] = [];
  const added: string[] = [];
  for (const task of tasks) {
    const hash = hashKey({ key: task.id });
    if (!seenSet.has(hash)) {
      seenSet.add(hash);
      added.push(hash);
      emitted.push(task);
    }
  }
  const merged = [...seen, ...added];
  const now = Date.now();
  const pruneDue =
    progress.scan === null &&
    merged.length > SEEN_CAP &&
    now - state.prunedAtMs >= PRUNE_INTERVAL_MS;
  const pruned = pruneDue
    ? await pruneSeen({ auth, list: state.list, hashes: merged, deadlineMs })
    : null;
  const kept = pruned ?? merged;
  if (kept.length > SEEN_CAP) {
    console.warn(
      `Google Tasks New Task: seen-task set over ${SEEN_CAP} ids, dropping the ${kept.length - SEEN_CAP} oldest`,
    );
  }
  return {
    emitted,
    state: {
      ...state,
      ...progress,
      seen: capSeen({ hashes: kept }).join(''),
      prunedAtMs: nextPrunedAtMs({ state, pruneDue, pruned: pruned !== null, now }),
    },
  };
}

function nextPrunedAtMs({
  state,
  pruneDue,
  pruned,
  now,
}: {
  state: TriggerState;
  pruneDue: boolean;
  pruned: boolean;
  now: number;
}): number {
  if (!pruneDue) {
    return state.prunedAtMs;
  }
  return pruned ? now : now - PRUNE_INTERVAL_MS + PRUNE_RETRY_MS;
}

async function pruneSeen({
  auth,
  list,
  hashes,
  deadlineMs,
}: {
  auth: OAuth2PropertyValue;
  list: string;
  hashes: string[];
  deadlineMs: number;
}): Promise<string[] | null> {
  const { tasks, complete } = await getAllTasks({
    auth,
    taskListId: list,
    params: listParams({ mode: RUN_ON_NEW_ONLY }),
    deadlineMs,
  });
  if (!complete) {
    return null;
  }
  const present = new Set(liveTasks({ tasks }).map((task) => hashKey({ key: task.id })));
  return hashes.filter((hash) => present.has(hash));
}

function advanceNewAndEdited({
  state,
  tasks,
  progress,
  scanStartedAtMs,
}: {
  state: TriggerState;
  tasks: LiveTask[];
  progress: ScanProgress;
  scanStartedAtMs: number;
}): { state: TriggerState; emitted: LiveTask[] } {
  const windowStartMs = Math.max(state.floorMs, state.cursorMs - OVERLAP_MS);
  const now = Date.now();
  const previous = decodeRecent({ recent: state.recent });
  const recentKeys = new Set(previous.map(([hash]) => hash));
  const emitted: LiveTask[] = [];
  const added: RecentEntry[] = [];
  for (const task of tasks) {
    const updatedMs = Date.parse(task.updated);
    if (!Number.isFinite(updatedMs) || updatedMs < windowStartMs) {
      continue;
    }
    if (updatedMs > scanStartedAtMs && updatedMs <= now) {
      continue;
    }
    const hash = hashKey({ key: `${task.id}|${task.updated}` });
    if (!recentKeys.has(hash)) {
      recentKeys.add(hash);
      added.push([hash, updatedMs]);
      emitted.push(task);
    }
  }
  const kept = [...previous, ...added]
    .filter(([, updatedMs]) => updatedMs >= progress.cursorMs - OVERLAP_MS)
    .sort((a, b) => b[1] - a[1]);
  const cursorOverlap = kept
    .filter(([, updatedMs]) => updatedMs <= progress.cursorMs)
    .slice(0, RECENT_CAP);
  const newest = kept.slice(0, RECENT_CAP);
  const keptHashes = new Set([...cursorOverlap, ...newest].map(([hash]) => hash));
  const recent = encodeRecent({ entries: kept.filter(([hash]) => keptHashes.has(hash)) });
  return { emitted, state: { ...state, ...progress, recent } };
}

function encodeRecent({ entries }: { entries: RecentEntry[] }): string {
  return entries
    .map(
      ([hash, updatedMs]) =>
        hash + Math.min(updatedMs, RECENT_TIME_MAX).toString(36).padStart(RECENT_TIME_LENGTH, '0'),
    )
    .join('');
}

function decodeRecent({ recent }: { recent: string }): RecentEntry[] {
  const width = HASH_LENGTH + RECENT_TIME_LENGTH;
  const entries: RecentEntry[] = [];
  for (let index = 0; index + width <= recent.length; index += width) {
    entries.push([
      recent.slice(index, index + HASH_LENGTH),
      parseInt(recent.slice(index + HASH_LENGTH, index + width), 36),
    ]);
  }
  return entries;
}

function maxUpdated({ fromMs, tasks }: { fromMs: number; tasks: LiveTask[] }): number {
  const now = Date.now();
  return tasks.reduce((acc, task) => {
    const updatedMs = Date.parse(task.updated);
    if (!Number.isFinite(updatedMs) || updatedMs > now) {
      return acc;
    }
    return Math.max(acc, updatedMs);
  }, fromMs);
}

function listParams({ mode }: { mode: RunOn }): Record<string, string> {
  return mode === RUN_ON_NEW_ONLY ? { showCompleted: 'true', showHidden: 'true' } : {};
}

function liveTasks({ tasks }: { tasks: Task[] }): LiveTask[] {
  return tasks.flatMap((task) =>
    typeof task.id === 'string' && task.id.length > 0 && task.deleted !== true
      ? [{ ...task, id: task.id, updated: task.updated ?? '' }]
      : [],
  );
}

function sortNewestFirst({ tasks }: { tasks: LiveTask[] }): LiveTask[] {
  return [...tasks].sort((a, b) => {
    const diff = sortableTime({ value: b.updated }) - sortableTime({ value: a.updated });
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });
}

function sortableTime({ value }: { value: string }): number {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
}

function resolveRunOn({ value }: { value: string | undefined | null }): RunOn {
  if (value === undefined || value === null || value === '') {
    return RUN_ON_NEW_AND_EDITED;
  }
  if (value === RUN_ON_NEW_ONLY || value === RUN_ON_NEW_AND_EDITED) {
    return value;
  }
  throw new Error(
    `Unknown "Run on" value "${value}". Choose "New tasks only" or "New and edited tasks".`,
  );
}

function hashKey({ key }: { key: string }): string {
  return createHash('sha256').update(key).digest('base64url').slice(0, HASH_LENGTH);
}

function splitHashes({ seen }: { seen: string }): string[] {
  const hashes: string[] = [];
  for (let index = 0; index + HASH_LENGTH <= seen.length; index += HASH_LENGTH) {
    hashes.push(seen.slice(index, index + HASH_LENGTH));
  }
  return hashes;
}

function uniqueHashes({ hashes }: { hashes: string[] }): string[] {
  return [...new Set(hashes)];
}

function capSeen({ hashes }: { hashes: string[] }): string[] {
  return hashes.length > SEEN_CAP ? hashes.slice(hashes.length - SEEN_CAP) : hashes;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseState({ raw }: { raw: unknown }): TriggerState | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const v = Reflect.get(raw, 'v');
  const mode = Reflect.get(raw, 'mode');
  const list = Reflect.get(raw, 'list');
  const cursorMs = Reflect.get(raw, 'cursorMs');
  const floorMs = Reflect.get(raw, 'floorMs');
  const seen = Reflect.get(raw, 'seen');
  const recent = Reflect.get(raw, 'recent');
  const prunedAtMs = Reflect.get(raw, 'prunedAtMs');
  const pending = parsePending({ raw: Reflect.get(raw, 'pending') });
  const scan = parseScan({ raw: Reflect.get(raw, 'scan') });
  if (
    v !== STATE_VERSION ||
    (mode !== RUN_ON_NEW_ONLY && mode !== RUN_ON_NEW_AND_EDITED) ||
    typeof list !== 'string' ||
    !isFiniteNumber(cursorMs) ||
    !isFiniteNumber(floorMs) ||
    typeof seen !== 'string' ||
    typeof recent !== 'string' ||
    recent.length % (HASH_LENGTH + RECENT_TIME_LENGTH) !== 0 ||
    !isFiniteNumber(prunedAtMs) ||
    pending === undefined ||
    scan === undefined
  ) {
    return null;
  }
  return { v, mode, list, cursorMs, floorMs, seen, recent, prunedAtMs, pending, scan };
}

function parseScan({ raw }: { raw: unknown }): PollScan | null | undefined {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw !== 'object') {
    return undefined;
  }
  const pageToken = Reflect.get(raw, 'pageToken');
  const windowMinMs = Reflect.get(raw, 'windowMinMs');
  const startedAtMs = Reflect.get(raw, 'startedAtMs');
  const maxUpdatedMs = Reflect.get(raw, 'maxUpdatedMs');
  if (
    typeof pageToken !== 'string' ||
    !isFiniteNumber(windowMinMs) ||
    !isFiniteNumber(startedAtMs) ||
    !isFiniteNumber(maxUpdatedMs)
  ) {
    return undefined;
  }
  return { pageToken, windowMinMs, startedAtMs, maxUpdatedMs };
}

function parsePending({ raw }: { raw: unknown }): PendingBaseline | null | undefined {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw !== 'object') {
    return undefined;
  }
  const pageToken = Reflect.get(raw, 'pageToken');
  const startedAtMs = Reflect.get(raw, 'startedAtMs');
  const seenUntilMs = Reflect.get(raw, 'seenUntilMs') ?? null;
  if (
    typeof pageToken !== 'string' ||
    !isFiniteNumber(startedAtMs) ||
    (seenUntilMs !== null && !isFiniteNumber(seenUntilMs))
  ) {
    return undefined;
  }
  return { pageToken, startedAtMs, seenUntilMs };
}

type RunOn = typeof RUN_ON_NEW_ONLY | typeof RUN_ON_NEW_AND_EDITED;

type RecentEntry = [string, number];

type LiveTask = Task & { id: string; updated: string };

type TriggerState = {
  v: typeof STATE_VERSION;
  mode: RunOn;
  list: string;
  cursorMs: number;
  floorMs: number;
  seen: string;
  recent: string;
  prunedAtMs: number;
  pending: PendingBaseline | null;
  scan: PollScan | null;
};

type PollScan = {
  pageToken: string;
  windowMinMs: number;
  startedAtMs: number;
  maxUpdatedMs: number;
};

type ScanProgress = { cursorMs: number; scan: PollScan | null };

type PendingBaseline = { pageToken: string; startedAtMs: number; seenUntilMs: number | null };
