import { afterEach, describe, expect, test, vi } from 'vitest';
import { newLinkCreatedTrigger } from '../src/lib/triggers/new-link-created';
import { DOMAIN_PROP, link, memoryStore, stubFetch } from './helpers';
import { AppConnectionType, Store } from '@activepieces/pieces-framework';

const WATERMARK_KEY = 'shortio-link-watermark-v2';

function context(store: ReturnType<typeof memoryStore>): TriggerContext {
  return { auth: { type: AppConnectionType.CUSTOM_AUTH, props: { apiKey: 'k' } }, propsValue: { domain: DOMAIN_PROP }, store };
}

function events(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object') : [];
}

const trigger: { run(context: TriggerContext): Promise<unknown>; onEnable(context: TriggerContext): Promise<void> } = newLinkCreatedTrigger;

afterEach(() => vi.unstubAllGlobals());

describe('new_link_created (P1-2, P1-4)', () => {
  test('onEnable stores a watermark from the newest link and emits nothing', async () => {
    stubFetch(() => ({ body: { links: [link({ createdAt: '2026-10-01T10:00:00.000Z' })] } }));
    const store = memoryStore();
    await trigger.onEnable(context(store));
    expect(store.read(WATERMARK_KEY)).toEqual({ createdAt: Date.parse('2026-10-01T10:00:00.000Z'), ids: ['lnk_abc_123'] });
  });
  test('run pages oldest-first past 150 links, skips seen ties, drops password', async () => {
    const base = Date.parse('2026-10-01T10:00:00.000Z');
    const page1 = Array.from({ length: 150 }, (_, i) => link({ idString: `lnk_p1_${i}`, createdAt: new Date(base + i).toISOString() }));
    page1[0] = link({ idString: 'lnk_abc_123', createdAt: new Date(base).toISOString() });
    const page2 = [link({ idString: 'lnk_p2_0', createdAt: new Date(base + 500).toISOString() })];
    const seen = stubFetch((request) => (request.url.searchParams.get('pageToken') ? { body: { links: page2 } } : { body: { links: page1, nextPageToken: 'tok' } }));
    const store = memoryStore({ [WATERMARK_KEY]: { createdAt: base, ids: ['lnk_abc_123'] } });
    const emitted = events(await trigger.run(context(store)));
    expect(seen[0].url.searchParams.get('dateSortOrder')).toBe('asc');
    expect(seen[0].url.searchParams.get('afterDate')).toBe(new Date(base - 1).toISOString());
    expect(emitted).toHaveLength(150);
    expect(emitted[0]['id']).toBe('lnk_p1_1');
    expect(emitted[149]['id']).toBe('lnk_p2_0');
    expect(JSON.stringify(emitted)).not.toContain('hunter2');
    expect(emitted[0]).not.toHaveProperty('password');
    expect(store.read(WATERMARK_KEY)).toEqual({ createdAt: base + 500, ids: ['lnk_p2_0'] });
    const again = await trigger.run(context(store));
    expect(again).toEqual([]);
  });
  test('deleting an old link does not re-emit anything', async () => {
    const base = Date.parse('2026-10-01T10:00:00.000Z');
    stubFetch(() => ({ body: { links: [link({ idString: 'lnk_a_1', createdAt: new Date(base).toISOString() })] } }));
    const store = memoryStore({ [WATERMARK_KEY]: { createdAt: base, ids: ['lnk_a_1'] } });
    expect(await trigger.run(context(store))).toEqual([]);
  });
  test('migrates from the legacy id list once', async () => {
    stubFetch(() => ({ body: { links: [link({ idString: 'lnk_new_1', createdAt: '2026-10-02T00:00:00.000Z' }), link({ idString: 'lnk_old_1' })] } }));
    const store = memoryStore({ 'shortio-last-link-ids': ['lnk_old_1'] });
    const emitted = events(await trigger.run(context(store)));
    expect(emitted.map((event) => event['id'])).toEqual(['lnk_new_1']);
    expect(store.read('shortio-last-link-ids')).toBeUndefined();
    expect(store.read(WATERMARK_KEY)).toMatchObject({ ids: ['lnk_new_1'] });
  });
});

type TriggerContext = {
  auth: { type: AppConnectionType.CUSTOM_AUTH; props: { apiKey: string } };
  propsValue: { domain: string };
  store: Store;
};
