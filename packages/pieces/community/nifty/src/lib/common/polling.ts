import { NiftyAuth, niftyClient, NiftyRecord } from './client';

export const niftyPolling = {
  fingerprint({ values }: { values: Array<string | boolean | null> }): string {
    return JSON.stringify(values);
  },

  readTimeState({ value, fp }: { value: unknown; fp: string }): TimeState | null {
    if (typeof value !== 'object' || value === null) {
      return null;
    }
    if (!('fp' in value) || value.fp !== fp || !('cp' in value) || typeof value.cp !== 'string') {
      return null;
    }
    if (!('seen' in value) || !isStringArray(value.seen)) {
      return null;
    }
    return { fp, cp: value.cp, seen: value.seen };
  },

  readIdState({ value, fp }: { value: unknown; fp: string }): IdState | null {
    if (typeof value !== 'object' || value === null || !('fp' in value) || value.fp !== fp) {
      return null;
    }
    if (!('known' in value) || !isStringArray(value.known) || !('dropped' in value) || !isStringArray(value.dropped)) {
      return null;
    }
    return { fp, known: value.known, dropped: value.dropped };
  },

  advanceTimeCursor({
    cursor,
    items,
    timeOf,
    keyOf,
  }: {
    cursor: TimeCursor;
    items: NiftyRecord[];
    timeOf: (item: NiftyRecord) => string;
    keyOf: (item: NiftyRecord) => string;
  }): { emit: NiftyRecord[]; cursor: TimeCursor } {
    const checkpoint = Date.parse(cursor.cp);
    const seen = new Set(cursor.seen);
    const unique = new Map<string, NiftyRecord>();
    for (const item of items) {
      const time = Date.parse(timeOf(item));
      if (Number.isNaN(time)) {
        continue;
      }
      const key = keyOf(item);
      const isNew = time > checkpoint || (time === checkpoint && !seen.has(key));
      if (isNew && !unique.has(key)) {
        unique.set(key, item);
      }
    }
    const emit = [...unique.values()].sort((a, b) => Date.parse(timeOf(a)) - Date.parse(timeOf(b)));
    if (emit.length === 0) {
      return { emit, cursor: { cp: cursor.cp, seen: cursor.seen } };
    }
    const newest = Date.parse(timeOf(emit[emit.length - 1]));
    const atNewest = emit.filter((item) => Date.parse(timeOf(item)) === newest).map(keyOf);
    const carried = newest === checkpoint ? cursor.seen : [];
    return {
      emit,
      cursor: {
        cp: new Date(newest).toISOString(),
        seen: [...carried, ...atNewest].slice(-MAX_SEEN),
      },
    };
  },

  coverScannedWindow({ cursor, scannedTo }: { cursor: TimeCursor; scannedTo: string }): TimeCursor {
    const covered = Date.parse(scannedTo) - 1;
    if (Date.parse(cursor.cp) >= covered) {
      return cursor;
    }
    return { cp: new Date(covered).toISOString(), seen: [] };
  },

  seedTimeCursor({
    items,
    timeOf,
    keyOf,
    now,
  }: {
    items: NiftyRecord[];
    timeOf: (item: NiftyRecord) => string;
    keyOf: (item: NiftyRecord) => string;
    now: string;
  }): TimeCursor {
    const times = items.map((item) => Date.parse(timeOf(item))).filter((t) => !Number.isNaN(t));
    if (times.length === 0) {
      return { cp: now, seen: [] };
    }
    const newest = times.reduce((max, t) => (t > max ? t : max), times[0]);
    return {
      cp: new Date(newest).toISOString(),
      seen: items
        .filter((item) => Date.parse(timeOf(item)) === newest)
        .map(keyOf)
        .slice(-MAX_SEEN),
    };
  },

  advanceIdSet({
    known,
    dropped,
    items,
    truncated,
  }: {
    known: string[];
    dropped: string[];
    items: NiftyRecord[];
    truncated: boolean;
  }): { emit: NiftyRecord[]; known: string[]; dropped: string[] } {
    const remembered = new Set([...known, ...dropped]);
    const visible: string[] = [];
    const visibleSet = new Set<string>();
    const emit: NiftyRecord[] = [];
    for (const item of items) {
      const id = niftyClient.text({ record: item, key: 'id' });
      if (id.length === 0 || visibleSet.has(id)) {
        continue;
      }
      visibleSet.add(id);
      visible.push(id);
      if (!remembered.has(id)) {
        emit.push(item);
      }
    }
    if (truncated) {
      const emittedIds = emit.map((item) => niftyClient.text({ record: item, key: 'id' }));
      return { emit, known: [...known, ...emittedIds].slice(-MAX_KNOWN_IDS), dropped };
    }
    const nowDropped = known.filter((id) => !visibleSet.has(id));
    const stillDropped = dropped.filter((id) => !visibleSet.has(id));
    return { emit, known: visible, dropped: [...stillDropped, ...nowDropped].slice(-MAX_DROPPED_IDS) };
  },

  async readWindow({
    from,
    to,
    fetchWindow,
  }: {
    from: string;
    to: string;
    fetchWindow: (window: { from: string; to: string }) => Promise<{ items: NiftyRecord[]; truncated: boolean }>;
  }): Promise<{ items: NiftyRecord[]; scannedTo: string; narrowed: boolean }> {
    const start = Date.parse(from);
    let end = Date.parse(to);
    for (let step = 0; step < MAX_NARROWING_STEPS; step++) {
      const windowEnd = new Date(end).toISOString();
      const result = await fetchWindow({ from, to: windowEnd });
      if (!result.truncated) {
        return { items: result.items, scannedTo: windowEnd, narrowed: step > 0 };
      }
      const span = end - start;
      if (span <= MIN_WINDOW_MS) {
        break;
      }
      end = start + Math.floor(span / 2);
    }
    throw new Error(
      `Nifty returned more than ${niftyClient.PAGE_SIZE * niftyClient.MAX_PAGES} completed tasks in one second after ${from}, so they cannot all be read. No completions were skipped; the trigger will retry on the next poll.`
    );
  },

  async fetchTasks({
    auth,
    projectId,
    includeSubtasks,
    extraQuery,
  }: {
    auth: NiftyAuth;
    projectId: string | undefined;
    includeSubtasks: boolean;
    extraQuery?: Record<string, string | number | boolean | undefined>;
  }): Promise<{ items: NiftyRecord[]; truncated: boolean }> {
    const { items, truncated } = await niftyClient.listAll({
      auth,
      path: 'tasks',
      key: 'tasks',
      query: {
        project_id: projectId,
        include_subtasks: projectId !== undefined && includeSubtasks ? true : undefined,
        ...extraQuery,
      },
    });
    return {
      items: items.filter((task) => includeSubtasks || niftyClient.text({ record: task, key: 'task' }).length === 0),
      truncated,
    };
  },
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

const MAX_SEEN = 200;
const MAX_KNOWN_IDS = 20000;
const MAX_DROPPED_IDS = 1000;
const MAX_NARROWING_STEPS = 40;
const MIN_WINDOW_MS = 1000;

export type TimeCursor = { cp: string; seen: string[] };
export type TimeState = TimeCursor & { fp: string };
export type IdState = { fp: string; known: string[]; dropped: string[] };
