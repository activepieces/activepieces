import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  addDays,
  endedDays,
  newGoalConversionTrigger,
  todayIn,
} from '../src/lib/triggers/new-goal-conversion';

const SITE = 'pa_TESTSITE01';
const STORE_KEY = 'privatus_goal_counts';

type Counts = Record<string, [number, number]>;

/**
 * A fake Privatus Analytics API. `days` holds the goal counts of each date
 * ([completions, conversions] per goal) and can be changed between checks.
 */
function fakeApi(timezone: string | null = 'Asia/Singapore') {
  const days: Record<string, Counts> = {};
  const requests: URL[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      requests.push(url);
      let data: unknown;
      if (url.pathname === `/sites/${SITE}.json`) {
        data = { id: SITE, domain: 'example.com', name: null, timezone };
      } else if (url.pathname === `/sites/${SITE}/goals.json`) {
        expect(url.searchParams.get('period')).toBe('custom');
        const from = url.searchParams.get('from') ?? '';
        expect(url.searchParams.get('to')).toBe(from);
        data = Object.entries(days[from] ?? {}).map(([id, [completions, conversions]]) => ({
          id,
          name: `Goal ${id}`,
          kind: 'event',
          pattern: null,
          event_name: id,
          archived: false,
          stats: { completions, conversions, conversion_rate: 0, value: 0, change: null },
        }));
      } else {
        return new Response(JSON.stringify({ error: { message: 'Not found' } }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    })
  );
  return {
    days,
    requests,
    goalDates: () =>
      requests
        .filter((url) => url.pathname.endsWith('/goals.json'))
        .map((url) => url.searchParams.get('from')),
  };
}

function memoryStore() {
  const data = new Map<string, string>();
  return {
    data,
    put: async <T>(key: string, value: T) => {
      data.set(key, JSON.stringify(value));
      return value;
    },
    get: async <T>(key: string): Promise<T | null> => {
      const raw = data.get(key);
      return raw === undefined ? null : (JSON.parse(raw) as T);
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function context(store = memoryStore(), goalId?: string) {
  return {
    auth: { type: 'SECRET_TEXT', secret_text: 'pat_test' },
    propsValue: { site_id: SITE, goal_id: goalId },
    store,
  } as never;
}

type GoalEvent = {
  goal_id: string;
  date: string;
  new_completions: number;
  new_conversions: number;
  day_completions: number;
};

async function poll(ctx: never): Promise<GoalEvent[]> {
  return (await newGoalConversionTrigger.run(ctx)) as GoalEvent[];
}

/** Sets the clock to a wall time in Singapore (UTC+8, no daylight saving). */
function setSingaporeTime(isoLocal: string) {
  vi.setSystemTime(new Date(`${isoLocal}+08:00`));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('dates', () => {
  test('today follows the site timezone, and UTC without one', () => {
    const now = new Date('2026-10-26T17:30:00Z');
    expect(todayIn('Asia/Singapore', now)).toBe('2026-10-27');
    expect(todayIn('America/Los_Angeles', now)).toBe('2026-10-26');
    expect(todayIn(null, now)).toBe('2026-10-26');
    expect(todayIn('Not/A_Zone', now)).toBe('2026-10-26');
  });

  test('adds days across months and years', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  test('ended days are capped at seven', () => {
    expect(endedDays('2026-10-25', '2026-10-26')).toEqual(['2026-10-25']);
    expect(endedDays('2026-10-26', '2026-10-26')).toEqual([]);
    expect(endedDays('2026-09-01', '2026-10-26')).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ]);
  });
});

describe('new goal conversion', () => {
  test('first run only stores the counts', async () => {
    const api = fakeApi();
    setSingaporeTime('2026-10-26T10:00:00');
    api.days['2026-10-26'] = { signup: [5, 4] };
    const store = memoryStore();

    expect(await poll(context(store))).toEqual([]);
    expect(await store.get(STORE_KEY)).toEqual({
      date: '2026-10-26',
      completions: { signup: 5 },
      conversions: { signup: 4 },
    });
  });

  test('enable stores the counts, so the first check after it emits only new completions', async () => {
    const api = fakeApi();
    setSingaporeTime('2026-10-26T10:00:00');
    api.days['2026-10-26'] = { signup: [5, 4], purchase: [1, 1] };
    const store = memoryStore();
    await newGoalConversionTrigger.onEnable(context(store));

    api.days['2026-10-26'] = { signup: [7, 5], purchase: [1, 1] };
    setSingaporeTime('2026-10-26T10:05:00');
    const events = await poll(context(store));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      goal_id: 'signup',
      date: '2026-10-26',
      new_completions: 2,
      new_conversions: 1,
      day_completions: 7,
    });
    expect(api.goalDates()).toEqual(['2026-10-26', '2026-10-26']);
  });

  test('completions just before midnight are sent after the day changes', async () => {
    const api = fakeApi();
    const store = memoryStore();
    setSingaporeTime('2026-10-26T23:58:00');
    api.days['2026-10-26'] = { signup: [10, 9] };
    await poll(context(store));

    // One more at 23:59, then one after midnight.
    api.days['2026-10-26'] = { signup: [11, 10] };
    api.days['2026-10-27'] = { signup: [1, 1] };
    setSingaporeTime('2026-10-27T00:03:00');
    const events = await poll(context(store));

    expect(events.map((e) => [e.date, e.new_completions, e.new_conversions])).toEqual([
      ['2026-10-26', 1, 1],
      ['2026-10-27', 1, 1],
    ]);
    expect(await store.get(STORE_KEY)).toMatchObject({ date: '2026-10-27', completions: { signup: 1 } });

    // The next check on the new day compares with the new day only.
    setSingaporeTime('2026-10-27T00:08:00');
    expect(await poll(context(store))).toEqual([]);
  });

  test('the day changes in the site timezone, not in UTC', async () => {
    const api = fakeApi('America/Los_Angeles');
    const store = memoryStore();
    // 23:58 on 26 October in Los Angeles is already 27 October in UTC.
    vi.setSystemTime(new Date('2026-10-27T06:58:00Z'));
    api.days['2026-10-26'] = { signup: [3, 3] };
    await poll(context(store));
    expect(await store.get(STORE_KEY)).toMatchObject({ date: '2026-10-26' });

    api.days['2026-10-26'] = { signup: [4, 4] };
    vi.setSystemTime(new Date('2026-10-27T07:03:00Z'));
    const events = await poll(context(store));
    expect(events.map((e) => [e.date, e.new_completions])).toEqual([['2026-10-26', 1]]);
    expect(api.goalDates().slice(-2)).toEqual(['2026-10-27', '2026-10-26']);
  });

  test('after a gap of several days, every missed day is sent once, oldest first', async () => {
    const api = fakeApi();
    const store = memoryStore();
    setSingaporeTime('2026-10-20T22:00:00');
    api.days['2026-10-20'] = { signup: [4, 4] };
    await poll(context(store));

    api.days['2026-10-20'] = { signup: [6, 5] };
    api.days['2026-10-21'] = { signup: [3, 2] };
    api.days['2026-10-22'] = {};
    api.days['2026-10-23'] = { signup: [2, 2], purchase: [1, 1] };
    setSingaporeTime('2026-10-23T09:00:00');
    const events = await poll(context(store));

    expect(events.map((e) => [e.goal_id, e.date, e.new_completions])).toEqual([
      ['signup', '2026-10-20', 2],
      ['signup', '2026-10-21', 3],
      ['signup', '2026-10-23', 2],
      ['purchase', '2026-10-23', 1],
    ]);
    expect(api.goalDates().slice(1)).toEqual(['2026-10-23', '2026-10-20', '2026-10-21', '2026-10-22']);
  });

  test('a gap longer than seven days looks back seven days only', async () => {
    const api = fakeApi();
    const store = memoryStore();
    await store.put(STORE_KEY, { date: '2026-09-01', completions: { signup: 1 }, conversions: { signup: 1 } });
    for (let day = '2026-10-19'; day < '2026-10-27'; day = addDays(day, 1)) {
      api.days[day] = { signup: [1, 1] };
    }
    setSingaporeTime('2026-10-26T09:00:00');
    const events = await poll(context(store));
    expect(events.map((e) => e.date)).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
    ]);
    expect(api.goalDates()).not.toContain('2026-09-01');
  });

  test('watches only the chosen goal', async () => {
    const api = fakeApi();
    const store = memoryStore();
    setSingaporeTime('2026-10-26T10:00:00');
    api.days['2026-10-26'] = { signup: [1, 1], purchase: [1, 1] };
    await poll(context(store, 'purchase'));
    api.days['2026-10-26'] = { signup: [5, 5], purchase: [2, 2] };
    const events = await poll(context(store, 'purchase'));
    expect(events.map((e) => [e.goal_id, e.new_completions])).toEqual([['purchase', 1]]);
  });

  test('a count that goes down sends nothing and becomes the new starting point', async () => {
    const api = fakeApi();
    const store = memoryStore();
    setSingaporeTime('2026-10-26T10:00:00');
    api.days['2026-10-26'] = { signup: [5, 5] };
    await poll(context(store));
    api.days['2026-10-26'] = { signup: [4, 4] };
    expect(await poll(context(store))).toEqual([]);
    api.days['2026-10-26'] = { signup: [5, 5] };
    expect((await poll(context(store))).map((e) => e.new_completions)).toEqual([1]);
  });

  test('a failed request keeps the stored counts, so nothing is lost', async () => {
    const api = fakeApi();
    const store = memoryStore();
    setSingaporeTime('2026-10-26T23:58:00');
    api.days['2026-10-26'] = { signup: [10, 10] };
    await poll(context(store));

    const working = globalThis.fetch;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 503, headers: { 'content-type': 'application/json' } }))
    );
    setSingaporeTime('2026-10-27T00:03:00');
    await expect(poll(context(store))).rejects.toThrow('503');
    expect(await store.get(STORE_KEY)).toMatchObject({ date: '2026-10-26', completions: { signup: 10 } });

    vi.stubGlobal('fetch', working);
    api.days['2026-10-26'] = { signup: [12, 11] };
    api.days['2026-10-27'] = {};
    setSingaporeTime('2026-10-27T00:08:00');
    expect((await poll(context(store))).map((e) => [e.date, e.new_completions])).toEqual([['2026-10-26', 2]]);
  });

  test('test returns today\'s goals that have completions', async () => {
    const api = fakeApi();
    setSingaporeTime('2026-10-26T10:00:00');
    api.days['2026-10-26'] = { signup: [3, 2], purchase: [0, 0] };
    const samples = (await newGoalConversionTrigger.test(context())) as GoalEvent[];
    expect(samples.map((e) => [e.goal_id, e.new_completions])).toEqual([['signup', 3]]);
  });

  test('disable clears the stored counts', async () => {
    fakeApi();
    const store = memoryStore();
    await store.put(STORE_KEY, { date: '2026-10-26', completions: {}, conversions: {} });
    await newGoalConversionTrigger.onDisable(context(store));
    expect(store.data.size).toBe(0);
  });
});
