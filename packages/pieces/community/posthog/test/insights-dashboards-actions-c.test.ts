import { httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PostHogApiError } from '../src/lib/common/client';
import { getInsight } from '../src/lib/actions/ai/get-insight';
import { createInsight } from '../src/lib/actions/ai/create-insight';
import { getDashboard } from '../src/lib/actions/ai/get-dashboard';
import { createDashboard } from '../src/lib/actions/ai/create-dashboard';
import { listActions } from '../src/lib/actions/ai/list-actions';
import { getAction } from '../src/lib/actions/ai/get-action';

const props = { personal_api_key: 'phx_secret', project_id: '123', api_host: 'https://eu.posthog.com', ingestion_host: '' };
const auth = { props };

function run({ action, propsValue = {} }: { action: { run: unknown }; propsValue?: Record<string, unknown> }) {
  return Reflect.apply(Reflect.get(action, 'run'), undefined, [{ auth, propsValue }]);
}

function mockSeq(...bodies: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const b of bodies) {
    if (b instanceof Error) spy.mockRejectedValueOnce(b);
    else spy.mockResolvedValueOnce({ status: 200, headers: {}, body: b });
  }
  return spy;
}

function req({ spy, i = 0 }: { spy: ReturnType<typeof mockSeq>; i?: number }) {
  return spy.mock.calls[i][0];
}

afterEach(() => vi.restoreAllMocks());

describe('metadata', () => {
  it.each([getInsight, createInsight, getDashboard, createDashboard, listActions, getAction])('$name is an ai action with schema', (a) => {
    expect(a.audience).toBe('ai');
    expect(a.outputSchema).toBeDefined();
    expect(a.aiMetadata?.description).toBeTruthy();
    for (const p of Object.values(a.props)) expect(Reflect.get(p, 'type')).not.toBe('DROPDOWN');
  });
});

describe('get_insight', () => {
  it('fetches by numeric id with cached result', async () => {
    const spy = mockSeq({ id: 7, short_id: 'abC1', name: 'Views', query: { kind: 'InsightVizNode', source: { kind: 'TrendsQuery' } }, result: [{ count: 3 }], dashboards: [2] });
    const out = await run({ action: getInsight, propsValue: { insightId: '7' } });
    expect(req({ spy }).url).toBe('https://eu.posthog.com/api/projects/123/insights/7/');
    expect(req({ spy }).queryParams).toEqual({ refresh: 'force_cache' });
    expect(out).toMatchObject({ id: 7, shortId: 'abC1', queryKind: 'TrendsQuery', result: [{ count: 3 }], resultTruncated: false, dashboardIds: [2], url: 'https://eu.posthog.com/project/123/insights/abC1' });
  });
  it('looks up short id and truncates large results', async () => {
    const big = Array.from({ length: 2000 }, (_, i) => ({ i, label: 'x'.repeat(20) }));
    const spy = mockSeq({ results: [{ id: 9, short_id: 'Zx9', result: big }] });
    const out = await run({ action: getInsight, propsValue: { insightId: 'Zx9', refresh: 'blocking' } });
    expect(req({ spy }).queryParams).toEqual({ short_id: 'Zx9', refresh: 'blocking' });
    expect(out.resultTruncated).toBe(true);
    expect(JSON.stringify(out.result).length).toBeLessThanOrEqual(20_000);
  });
  it('none omits result; unknown short id fails', async () => {
    mockSeq({ id: 1, short_id: 'a', result: [1] }, { results: [] });
    expect((await run({ action: getInsight, propsValue: { insightId: '1', refresh: 'none' } })).result).toBeNull();
    await expect(run({ action: getInsight, propsValue: { insightId: 'nope' } })).rejects.toThrow('No insight with short ID nope');
  });
  it('rejects path characters', async () => {
    await expect(run({ action: getInsight, propsValue: { insightId: '../x' } })).rejects.toThrow('letters and digits');
  });
});

describe('create_insight', () => {
  it('posts a trends query and dashboard', async () => {
    const spy = mockSeq({ id: 5, short_id: 's5', name: 'N', dashboards: [4] });
    const out = await run({ action: createInsight, propsValue: { name: 'N', event: '$pageview', math: 'dau', dashboardId: '4' } });
    expect(req({ spy }).method).toBe('POST');
    expect(req({ spy }).body).toEqual({
      name: 'N',
      description: '',
      saved: true,
      query: { kind: 'InsightVizNode', source: { kind: 'TrendsQuery', series: [{ kind: 'EventsNode', event: '$pageview', name: '$pageview', math: 'dau' }], interval: 'day', dateRange: { date_from: '-7d' }, trendsFilter: { display: 'ActionsLineGraph' } } },
      dashboards: [4],
    });
    expect(out).toMatchObject({ id: 5, dashboardIds: [4] });
  });
  it.each([{ math: 'sum' }, { dateFrom: 'yesterday' }, { dashboardId: 'x' }, { interval: 'year' }])('validates %o', async (extra) => {
    await expect(run({ action: createInsight, propsValue: { name: 'N', event: 'e', ...extra } })).rejects.toThrow();
  });
});

describe('dashboards', () => {
  it('get_dashboard summarises tiles and skips deleted', async () => {
    const spy = mockSeq({
      id: 3,
      name: 'D',
      created_by: { email: 'a@b.co' },
      tiles: [
        { id: 1, insight: { id: 7, short_id: 'k', name: 'Views', query: { source: { kind: 'TrendsQuery' } } } },
        { id: 2, text: { body: 'hello' } },
        { id: 3, deleted: true, insight: { id: 8 } },
      ],
    });
    const out = await run({ action: getDashboard, propsValue: { dashboardId: '3' } });
    expect(req({ spy }).url).toBe('https://eu.posthog.com/api/projects/123/dashboards/3/');
    expect(out.tileCount).toBe(2);
    expect(out.tiles[0]).toMatchObject({ type: 'insight', insightId: 7, insightName: 'Views', queryKind: 'TrendsQuery' });
    expect(out.tiles[1]).toMatchObject({ type: 'text', text: 'hello', insightId: null });
    expect(out).toMatchObject({ createdBy: 'a@b.co', url: 'https://eu.posthog.com/project/123/dashboard/3' });
  });
  it('create_dashboard posts name', async () => {
    const spy = mockSeq({ id: 11, name: 'New', pinned: true });
    const out = await run({ action: createDashboard, propsValue: { name: 'New', pinned: true } });
    expect(req({ spy }).body).toEqual({ name: 'New', description: '', pinned: true });
    expect(out).toMatchObject({ id: 11, pinned: true });
  });
  it('surfaces 404', async () => {
    mockSeq(Object.assign(new Error('http'), { response: { status: 404, body: { detail: 'Not found.' }, headers: {} } }));
    const err: unknown = await run({ action: getDashboard, propsValue: { dashboardId: '9' } }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PostHogApiError);
  });
});

describe('actions', () => {
  it('list_actions pages', async () => {
    const spy = mockSeq({ results: [{ id: 1, name: 'Signed up', steps: [{}, {}] }], next: 'https://eu.posthog.com/api/projects/123/actions/?offset=1' });
    const out = await run({ action: listActions, propsValue: { limit: 1, search: 'sign' } });
    expect(req({ spy }).queryParams).toEqual({ limit: '1', offset: '0', search: 'sign' });
    expect(out).toMatchObject({ count: 1, hasMore: true, nextOffset: 1, items: [{ id: 1, stepCount: 2 }] });
  });
  it('get_action maps steps', async () => {
    const spy = mockSeq({ id: 4, name: 'A', steps: [{ event: '$autocapture', url: '/x', url_matching: 'contains', selector: 'button' }] });
    const out = await run({ action: getAction, propsValue: { actionId: '4' } });
    expect(req({ spy }).url).toBe('https://eu.posthog.com/api/projects/123/actions/4/');
    expect(out.steps[0]).toMatchObject({ event: '$autocapture', urlMatching: 'contains', selector: 'button', properties: [] });
  });
  it('get_action rejects non-numeric id', async () => {
    await expect(run({ action: getAction, propsValue: { actionId: 'a/b' } })).rejects.toThrow('numeric');
  });
});
