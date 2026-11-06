/// <reference types="vitest/globals" />

import { bannerbearClient, RawImage } from '../common/client';
import { newImageCompletedTrigger } from './new-image-completed';

describe('bannerbear new-image-completed', () => {
  let feed: RawImage[];
  let store: Map<string, unknown>;
  let clock: number;

  beforeEach(() => {
    feed = [];
    store = new Map();
    clock = Date.parse('2030-01-01T00:00:00.000Z');
    vi.spyOn(bannerbearClient, 'request').mockImplementation(
      async ({ path, queryParams }) => fakeRequest({ feed, path, queryParams })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const addImages = ({ count, status }: { count: number; status: string }) => {
    const added: RawImage[] = [];
    for (let i = 0; i < count; i++) {
      clock += 1000;
      added.push({
        uid: `img-${clock}`,
        status,
        created_at: new Date(clock).toISOString(),
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      });
    }
    feed = [...added.reverse(), ...feed];
    return added;
  };

  const context = ({ isRepublish }: { isRepublish: boolean }) => ({
    auth: { secret_text: 'v2-key' },
    propsValue: {},
    isRepublish,
    store: {
      get: async (key: string) => store.get(key) ?? null,
      put: async (key: string, value: unknown) => {
        store.set(key, value);
        return value;
      },
      delete: async (key: string) => {
        store.delete(key);
      },
    },
  });

  const call = async ({ hook, isRepublish = false }: { hook: 'onEnable' | 'onDisable' | 'run'; isRepublish?: boolean }) =>
    Reflect.apply(newImageCompletedTrigger[hook], newImageCompletedTrigger, [context({ isRepublish })]);

  const runUntilQuiet = async () => {
    const emitted: string[] = [];
    for (let i = 0; i < 60; i++) {
      const batch: { uid: string }[] = await call({ hook: 'run' });
      emitted.push(...batch.map((image) => image.uid));
    }
    return emitted;
  };

  test('delivers every image of a burst longer than ten pages exactly once', async () => {
    addImages({ count: 5, status: 'completed' });
    await call({ hook: 'onEnable' });
    const burst = addImages({ count: 1250, status: 'completed' });

    const emitted = await runUntilQuiet();

    expect(emitted).toHaveLength(burst.length);
    expect(new Set(emitted)).toEqual(new Set(burst.map((image) => image.uid)));
  });

  test('keeps paging when the server returns fewer items than the requested limit', async () => {
    addImages({ count: 5, status: 'completed' });
    await call({ hook: 'onEnable' });
    const burst = addImages({ count: 120, status: 'completed' });
    vi.spyOn(bannerbearClient, 'request').mockImplementation(async ({ path, queryParams }) =>
      fakeRequest({ feed, path, queryParams: { ...queryParams, limit: '25' } })
    );

    const emitted = await runUntilQuiet();

    expect(new Set(emitted)).toEqual(new Set(burst.map((image) => image.uid)));
    expect(emitted).toHaveLength(burst.length);
  });

  test('recovers pending images that overflow the pending list', async () => {
    await call({ hook: 'onEnable' });
    const pending = addImages({ count: 2100, status: 'pending' });
    await runUntilQuiet();
    for (const image of feed) {
      image.status = 'completed';
      image.completed_at = new Date().toISOString();
    }

    const emitted = await runUntilQuiet();

    expect(emitted).toHaveLength(pending.length);
    expect(new Set(emitted)).toEqual(new Set(pending.map((image) => image.uid)));
  });

  test('does not fire completed images from before enable that sit beyond page 1', async () => {
    addImages({ count: 60, status: 'completed' });
    vi.spyOn(bannerbearClient, 'request').mockImplementation(async ({ path, queryParams }) =>
      fakeRequest({ feed, path, queryParams: { ...queryParams, limit: '25' } })
    );
    await call({ hook: 'onEnable' });
    const fresh = addImages({ count: 24, status: 'completed' });

    const emitted = await runUntilQuiet();

    expect(new Set(emitted)).toEqual(new Set(fresh.map((image) => image.uid)));
    expect(emitted).toHaveLength(fresh.length);
  });

  test('fires images from before enable that were still rendering and finish later', async () => {
    const old = addImages({ count: 26, status: 'pending' });
    vi.spyOn(bannerbearClient, 'request').mockImplementation(async ({ path, queryParams }) =>
      fakeRequest({ feed, path, queryParams: { ...queryParams, limit: '25' } })
    );
    await call({ hook: 'onEnable' });
    const fresh = addImages({ count: 24, status: 'completed' });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const first = await runUntilQuiet();
    for (const image of feed) {
      if (image.status === 'pending') {
        image.status = 'completed';
        image.completed_at = new Date().toISOString();
      }
    }

    const emitted = [...first, ...(await runUntilQuiet())];

    expect(new Set(emitted)).toEqual(new Set([...fresh, ...old].map((image) => image.uid)));
    expect(emitted).toHaveLength(fresh.length + old.length);
  });

  test('rotates the pending queue so slow renders do not block later images', async () => {
    await call({ hook: 'onEnable' });
    const later = addImages({ count: 30, status: 'pending' });
    const slow = addImages({ count: 25, status: 'pending' });
    await call({ hook: 'run' });
    addImages({ count: 150, status: 'completed' });
    await runUntilQuiet();
    const laterUids = new Set(later.map((image) => image.uid));
    for (const image of feed) {
      if (laterUids.has(image.uid)) {
        image.status = 'completed';
        image.completed_at = new Date().toISOString();
      }
    }
    expect(slow).toHaveLength(25);

    const emitted: string[] = [];
    for (let i = 0; i < 4; i++) {
      const batch: { uid: string }[] = await call({ hook: 'run' });
      emitted.push(...batch.map((image) => image.uid));
    }

    expect(new Set(emitted)).toEqual(laterUids);
  });

  test('republish keeps the stored state and disable leaves it in place', async () => {
    addImages({ count: 3, status: 'completed' });
    await call({ hook: 'onEnable' });
    const before = structuredClone(store.get(STORE_KEY));
    addImages({ count: 4, status: 'completed' });

    await call({ hook: 'onDisable' });
    await call({ hook: 'onEnable', isRepublish: true });

    expect(store.get(STORE_KEY)).toEqual(before);
    const emitted = await runUntilQuiet();
    expect(emitted).toHaveLength(4);
  });
});

async function fakeRequest({
  feed,
  path,
  queryParams,
}: {
  feed: RawImage[];
  path: string;
  queryParams?: Record<string, string>;
}): Promise<never> {
  if (path === '/images') {
    const page = Number(queryParams?.['page'] ?? '1');
    const limit = Number(queryParams?.['limit'] ?? '25');
    return Reflect.apply(identity, null, [feed.slice((page - 1) * limit, page * limit).map((image) => ({ ...image }))]);
  }
  const uid = decodeURIComponent(path.replace('/images/', ''));
  const image = feed.find((i) => i.uid === uid);
  if (!image) throw new Error('HTTP 404');
  return Reflect.apply(identity, null, [{ ...image }]);
}

function identity(value: unknown): unknown {
  return value;
}

const STORE_KEY = 'bannerbear_new_image_completed_state';
