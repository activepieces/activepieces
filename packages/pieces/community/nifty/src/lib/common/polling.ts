import { NiftyAuth, niftyClient, NiftyRecord } from './client';

const MAX_SEEN = 200;
const MAX_KNOWN_IDS = 10000;

export const niftyPolling = {
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
      return { emit, cursor };
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

  advanceIdSet({ known, items }: { known: string[]; items: NiftyRecord[] }): { emit: NiftyRecord[]; known: string[] } {
    const knownSet = new Set(known);
    const emit = items.filter((item) => {
      const id = niftyClient.text({ record: item, key: 'id' });
      if (id.length === 0 || knownSet.has(id)) {
        return false;
      }
      knownSet.add(id);
      return true;
    });
    if (emit.length === 0) {
      return { emit, known };
    }
    const emittedIds = emit.map((item) => niftyClient.text({ record: item, key: 'id' }));
    return { emit, known: [...known, ...emittedIds].slice(-MAX_KNOWN_IDS) };
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
  }): Promise<NiftyRecord[]> {
    const { items } = await niftyClient.listAll({
      auth,
      path: 'tasks',
      key: 'tasks',
      query: {
        project_id: projectId,
        include_subtasks: projectId !== undefined && includeSubtasks ? true : undefined,
        ...extraQuery,
      },
    });
    return items.filter((task) => includeSubtasks || niftyClient.text({ record: task, key: 'task' }).length === 0);
  },
};

export type TimeCursor = { cp: string; seen: string[] };
