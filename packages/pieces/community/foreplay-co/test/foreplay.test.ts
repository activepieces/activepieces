import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { foreplayCo } from '../src';
import { findAds, findBoards, findBrands, getAdById, getAdsByPage } from '../src/lib/actions';
import { discoverBrandsByAds } from '../src/lib/actions/ai/discover-brands-by-ads';
import { findBrandsByDomain } from '../src/lib/actions/ai/find-brands-by-domain';
import { getAd } from '../src/lib/actions/ai/get-ad';
import { getBrandAnalytics } from '../src/lib/actions/ai/get-brand-analytics';
import { getCreditUsage } from '../src/lib/actions/ai/get-credit-usage';
import { getLensReport } from '../src/lib/actions/ai/get-lens-report';
import { getSpyderBrand } from '../src/lib/actions/ai/get-spyder-brand';
import { getSpyderTopAds } from '../src/lib/actions/ai/get-spyder-top-ads';
import { listAdDuplicates } from '../src/lib/actions/ai/list-ad-duplicates';
import { listBoardAds } from '../src/lib/actions/ai/list-board-ads';
import { listBoardBrands } from '../src/lib/actions/ai/list-board-brands';
import { listBoards } from '../src/lib/actions/ai/list-boards';
import { listBrandAds } from '../src/lib/actions/ai/list-brand-ads';
import { listPageAds } from '../src/lib/actions/ai/list-page-ads';
import { listSpyderBrandAds } from '../src/lib/actions/ai/list-spyder-brand-ads';
import { listSpyderBrands } from '../src/lib/actions/ai/list-spyder-brands';
import { listSpyderRankedAds } from '../src/lib/actions/ai/list-spyder-ranked-ads';
import { listSpyderRelatedPages } from '../src/lib/actions/ai/list-spyder-related-pages';
import { listSwipefileAds } from '../src/lib/actions/ai/list-swipefile-ads';
import { searchAds } from '../src/lib/actions/ai/search-ads';
import { searchBrands } from '../src/lib/actions/ai/search-brands';
import { foreplayCoAuth } from '../src/lib/auth';
import { newAdInBoard, newAdInSpyder, newSwipefileAd } from '../src/lib/triggers';

const auth = { secret_text: ' fp_key ' };
const BASE = 'https://public.api.foreplay.co';

function call({ target, method, args }: { target: unknown; method: string; args: Record<string, unknown> }) {
  return Reflect.apply(Reflect.get(Object(target), method), target, [args]);
}

function run({ action, propsValue }: { action: unknown; propsValue: Record<string, unknown> }) {
  return call({ target: action, method: 'run', args: { auth, propsValue } });
}

function okWith({ data, metadata = {}, headers = {} }: { data: unknown; metadata?: Record<string, unknown>; headers?: Record<string, string> }) {
  return { status: 200, headers, body: { metadata: { success: true, status_code: 200, ...metadata }, data } };
}

function ok(data: unknown) {
  return okWith({ data });
}

function mock(...responses: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const r of responses) spy.mockResolvedValueOnce(Object(r));
  return spy;
}

function httpFailure({ status, body }: { status: number; body: unknown }) {
  return Object.assign(new Error('http failure'), { response: { status, body } });
}

function urlOf(spy: ReturnType<typeof mock>): URL {
  return nthUrl({ spy, index: 0 });
}

function nthUrl({ spy, index }: { spy: ReturnType<typeof mock>; index: number }): URL {
  return new URL(String(spy.mock.calls[index][0].url));
}

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    get: async (key: string) => (data.has(key) ? data.get(key) : null),
    put: async (key: string, value: unknown) => {
      data.set(key, value);
      return value;
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

const rawAd = (id: string) => ({ id, ad_id: `pub_${id}`, name: `Ad ${id}`, brand_id: 'brand_1', publisher_platform: ['facebook'], live: true, started_running: 1760745600, foreplay_url: `https://app.foreplay.co/x/${id}` });

afterEach(() => vi.restoreAllMocks());

const aiActions = [searchAds, getAd, listAdDuplicates, listPageAds, listBrandAds, searchBrands, findBrandsByDomain, discoverBrandsByAds, getBrandAnalytics, listBoards, listBoardBrands, listBoardAds, listSwipefileAds, listSpyderBrands, getSpyderBrand, listSpyderBrandAds, getSpyderTopAds, listSpyderRankedAds, listSpyderRelatedPages, getCreditUsage, getLensReport];
const humanActions = [findAds, findBoards, findBrands, getAdById, getAdsByPage];

describe('metadata', () => {
  it.each(aiActions)('$name is ai, read-only, with schema', (a) => {
    expect(a.audience).toBe('ai');
    expect(a.outputSchema).toBeDefined();
    expect(typeof a.aiMetadata?.description).toBe('string');
    expect(a.aiMetadata?.idempotent).toBe(true);
    expect(['READ', 'SEARCH']).toContain(a.classification);
  });
  it.each(humanActions)('$name is human with schema', (a) => {
    expect(a.audience).toBe('human');
    expect(a.outputSchema).toBeDefined();
  });
  it('registers every action and the custom api call', () => {
    const actions = Object.values(foreplayCo.actions());
    expect(actions).toHaveLength(27);
    expect(actions.filter((a) => a.audience === 'ai')).toHaveLength(21);
    expect(foreplayCo.minimumSupportedRelease).toBe('0.88.2');
  });
});

describe('client', () => {
  it('sends the raw API key, GET, no redirects, repeated array params', async () => {
    const spy = mock(okWith({ data: [rawAd('a1')], metadata: { cursor: 'c2' }, headers: { 'x-credit-cost': '1', 'x-credits-remaining': '99' } }));
    const out = await run({ action: searchAds, propsValue: { query: ' shoes ', displayFormats: ['video', 'image'], niches: ['food'], live: 'false', startDate: '2026-01-02T03:04:05.000Z', endDate: '2026-02-01', limit: 1 } });
    const req = spy.mock.calls[0][0];
    expect(req.method).toBe(HttpMethod.GET);
    expect(req.headers).toMatchObject({ Authorization: 'fp_key' });
    expect(req.followRedirects).toBe(false);
    const url = urlOf(spy);
    expect(url.origin + url.pathname).toBe(`${BASE}/api/discovery/ads`);
    expect(url.searchParams.getAll('display_format')).toEqual(['video', 'image']);
    expect(url.searchParams.getAll('niches')).toEqual(['food/drink']);
    expect(url.searchParams.get('query')).toBe('shoes');
    expect(url.searchParams.get('live')).toBe('false');
    expect(url.searchParams.get('start_date')).toBe('2026-01-02 03:04:05');
    expect(url.searchParams.get('end_date')).toBe('2026-02-01');
    expect(url.searchParams.get('limit')).toBe('1');
    expect(out).toMatchObject({ count: 1, hasMore: true, nextCursor: 'c2', creditCost: 1, creditsRemaining: 99 });
    expect(out.items[0]).toMatchObject({ id: 'a1', adId: 'pub_a1', publisherPlatforms: ['facebook'], startedRunning: '2025-10-18T00:00:00.000Z', foreplayUrl: 'https://app.foreplay.co/x/a1' });
  });
  it('reports no next page when fewer items than the limit come back', async () => {
    mock(okWith({ data: [rawAd('a1')], metadata: { cursor: 'c2' } }));
    const out = await run({ action: searchAds, propsValue: { limit: 5 } });
    expect(out).toMatchObject({ hasMore: false, nextCursor: null });
  });
  it('surfaces the Foreplay error message with a hint', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(httpFailure({ status: 402, body: { metadata: { success: false, message: 'An error occurred' }, error: { message: 'Not enough credits' } } }));
    await expect(run({ action: getAd, propsValue: { adId: 'a1' } })).rejects.toThrow('Foreplay API error (402): Not enough credits. Your Foreplay account is out of API credits.');
  });
  it('formats 422 validation details', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(httpFailure({ status: 422, body: { detail: [{ loc: ['query', 'limit'], msg: 'Input should be less than or equal to 250' }] } }));
    await expect(run({ action: getAd, propsValue: { adId: 'a1' } })).rejects.toThrow('limit: Input should be less than or equal to 250');
  });
  it('throws on a 200 with success false', async () => {
    mock({ status: 200, headers: {}, body: { metadata: { success: false, status_code: 404, message: 'Ad not found' }, data: [] } });
    await expect(run({ action: getAd, propsValue: { adId: 'a1' } })).rejects.toThrow('Foreplay API error (404): Ad not found');
  });
  it('retries a 429 after a fixed backoff (HttpError has no headers) then succeeds', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(httpClient, 'sendRequest');
    spy.mockRejectedValueOnce(httpFailure({ status: 429, body: { error: { message: 'slow down' } } }));
    spy.mockResolvedValueOnce(Object(ok([])));
    const pending = run({ action: listBoards, propsValue: {} });
    await vi.advanceTimersByTimeAsync(1_999);
    expect(spy).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    const out = await pending;
    vi.useRealTimers();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(out).toMatchObject({ items: [], count: 0 });
  });
  it('gives up after repeated 429s with the vendor text', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) spy.mockRejectedValueOnce(httpFailure({ status: 429, body: { error: { message: 'rate limited' } } }));
    const pending = expect(run({ action: listBoards, propsValue: {} })).rejects.toThrow('Foreplay API error (429): rate limited');
    await vi.advanceTimersByTimeAsync(6_000);
    await pending;
    vi.useRealTimers();
    expect(spy).toHaveBeenCalledTimes(3);
  });
  it('rejects a missing key before calling Foreplay', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(call({ target: listBoards, method: 'run', args: { auth: { secret_text: ' ' }, propsValue: {} } })).rejects.toThrow('no API key');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('validation', () => {
  it.each([
    [searchAds, { limit: 251 }, 'Limit'],
    [searchAds, { niches: ['bogus'] }, 'Niches: "bogus" is not supported'],
    [searchAds, { startDate: '2026-02-02', endDate: '2026-01-01' }, 'Start Date must be on or before End Date'],
    [searchAds, { videoDurationMin: 30, videoDurationMax: 10 }, 'Min Video Duration'],
    [searchAds, { live: 'maybe' }, 'true or false'],
    [getAd, { adId: '../x' }, 'Foreplay ID'],
    [listPageAds, { pageId: 'nike' }, 'numeric Facebook page ID'],
    [listBrandAds, { brandIds: [] }, 'Brand IDs is required'],
    [findBrandsByDomain, { domain: 'not a domain' }, 'Domain'],
    [discoverBrandsByAds, {}, 'at least one filter'],
    [getLensReport, { lensId: '5', from: '2026-02-01', to: '2026-01-01', breakdownType: 'overall', provider: 'facebook' }, 'From must be on or before To'],
    [getLensReport, { lensId: '5', from: '2026-01-01', to: '2026-01-02', breakdownType: 'bad', provider: 'facebook' }, 'Breakdown'],
  ])('%#', async (action, propsValue, message) => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(run({ action, propsValue })).rejects.toThrow(message);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('ai actions', () => {
  it('get_ad by public id encodes the path', async () => {
    const spy = mock(ok(rawAd('a:1')));
    const out = await run({ action: getAd, propsValue: { adId: 'a:1' } });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/api/ad/a%3A1`);
    expect(out).toMatchObject({ id: 'a:1', name: 'Ad a:1' });
  });
  it('get_ad null data (internal id) explains the public id', async () => {
    mock(ok(null));
    await expect(run({ action: getAd, propsValue: { adId: 'a1' } })).rejects.toThrow('public ad library ID');
  });
  it('get_ad fails clearly on empty data', async () => {
    mock(ok([]));
    await expect(run({ action: getAd, propsValue: { adId: 'a1' } })).rejects.toThrow('no record');
  });
  it('list_ad_duplicates', async () => {
    const spy = mock(ok([rawAd('d1'), rawAd('d2')]));
    const out = await run({ action: listAdDuplicates, propsValue: { adId: 'a1' } });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/api/ad/duplicates/a1`);
    expect(out.count).toBe(2);
  });
  it('list_ad_duplicates rejects an internal id', async () => {
    const spy = mock(ok([]));
    await expect(run({ action: listAdDuplicates, propsValue: { adId: 'ypIh0DwLFjabd6aDqxGo' } })).rejects.toThrow(/public ad library ID/);
    expect(spy).not.toHaveBeenCalled();
  });
  it('list_page_ads sends page id and collect', async () => {
    const spy = mock(ok([]));
    await run({ action: listPageAds, propsValue: { pageId: ' 123 ', collectIfEmpty: true, order: 'oldest' } });
    const url = urlOf(spy);
    expect(url.pathname).toBe('/api/brand/getAdsByPageId');
    expect(Object.fromEntries(url.searchParams)).toEqual({ page_id: '123', collect: 'true', order: 'oldest', limit: '10' });
  });
  it('list_brand_ads repeats brand_ids', async () => {
    const spy = mock(ok([]));
    await run({ action: listBrandAds, propsValue: { brandIds: ['b1', 'b2'] } });
    expect(urlOf(spy).searchParams.getAll('brand_ids')).toEqual(['b1', 'b2']);
  });
  it('search_brands maps brands', async () => {
    const spy = mock(ok([{ id: 'b1', name: 'Nike', description: { text: 'Just do it' }, ad_library_id: '15087023444', ads_count: 5, active_ads_count: 2, niches: [], websites: ['nike.com'] }]));
    const out = await run({ action: searchBrands, propsValue: { query: 'nike', includeEmpty: true, minAds: 1 } });
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ query: 'nike', limit: '10', include_empty: 'true', min_ads: '1' });
    expect(out.items[0]).toMatchObject({ id: 'b1', description: 'Just do it', pageId: '15087023444', adsCount: 5, activeAdsCount: 2 });
  });
  it('find_brands_by_domain', async () => {
    const spy = mock(ok([]));
    await run({ action: findBrandsByDomain, propsValue: { domain: 'https://allbirds.com', order: 'least_ranked' } });
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ domain: 'https://allbirds.com', limit: '10', order: 'least_ranked' });
  });
  it('discover_brands_by_ads', async () => {
    const spy = mock(ok([]));
    await run({ action: discoverBrandsByAds, propsValue: { niches: ['beauty'], publisherPlatforms: ['tiktok'] } });
    expect(urlOf(spy).pathname).toBe('/api/discovery/brands/explore');
    expect(urlOf(spy).searchParams.get('publisher_platform')).toBe('tiktok');
  });
  it('discover_brands_by_ads does not offer running-day filters the endpoint ignores', () => {
    expect(discoverBrandsByAds.props).not.toHaveProperty('runningDurationMinDays');
    expect(discoverBrandsByAds.props).not.toHaveProperty('runningDurationMaxDays');
    expect(listBoardAds.props).toHaveProperty('runningDurationMinDays');
  });
  it('get_brand_analytics only points agents at search_brands for pageId', () => {
    expect(getBrandAnalytics.aiMetadata?.description).not.toContain('or ads');
  });
  it('get_brand_analytics', async () => {
    const spy = mock(ok([{ date: '2026-10-01', active_count: 3, inactive_count: 1, video: 2, image: 1 }]));
    const out = await run({ action: getBrandAnalytics, propsValue: { id: ' 2029 ', startDate: '2026-10-01' } });
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ id: '2029', start_date: '2026-10-01' });
    expect(out.items[0]).toEqual({ date: '2026-10-01', activeCount: 3, inactiveCount: 1, formats: { video: 2, image: 1 } });
  });
  it('get_brand_analytics rejects a non-numeric brand id', async () => {
    const spy = mock(ok([]));
    await expect(run({ action: getBrandAnalytics, propsValue: { id: 'b1' } })).rejects.toThrow('numeric Facebook page ID');
    expect(spy).not.toHaveBeenCalled();
  });
  it('list_boards returns all boards', async () => {
    const spy = mock(ok([{ id: 'bd1', name: 'Inspo', description: '', created_at: 1737912010 }]));
    const out = await run({ action: listBoards, propsValue: {} });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/api/boards`);
    expect(out.items[0]).toEqual({ id: 'bd1', name: 'Inspo', description: '', createdAt: '2025-01-26T17:20:10.000Z' });
  });
  it('list_board_brands pages by offset', async () => {
    const spy = mock(ok(Array.from({ length: 10 }, (_, i) => ({ id: `b${i}`, name: `B${i}` }))));
    const out = await run({ action: listBoardBrands, propsValue: { boardId: 'bd1', offset: 10 } });
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ board_id: 'bd1', limit: '10', offset: '10' });
    expect(out).toMatchObject({ count: 10, hasMore: true, nextOffset: 20 });
  });
  it('list_board_ads', async () => {
    const spy = mock(ok([]));
    await run({ action: listBoardAds, propsValue: { boardId: 'bd1', cursor: 'abc' } });
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ board_id: 'bd1', cursor: 'abc', limit: '10' });
  });
  it('list_swipefile_ads', async () => {
    const spy = mock(ok([rawAd('s1')]));
    const out = await run({ action: listSwipefileAds, propsValue: { order: 'saved_newest', limit: 1 } });
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ order: 'saved_newest', limit: '1', offset: '0' });
    expect(out).toMatchObject({ hasMore: true, nextOffset: 1 });
  });
  it('list_spyder_brands', async () => {
    const spy = mock(ok([{ id: 'b1', name: 'Nike' }]));
    const out = await run({ action: listSpyderBrands, propsValue: {} });
    expect(urlOf(spy).pathname).toBe('/api/spyder/brands');
    expect(out).toMatchObject({ count: 1, hasMore: false, nextOffset: null });
  });
  it('get_spyder_brand', async () => {
    const spy = mock(ok({ id: 'b1', name: 'Nike' }));
    const out = await run({ action: getSpyderBrand, propsValue: { brandId: 'b1' } });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/api/spyder/brand?brand_id=b1`);
    expect(out).toMatchObject({ id: 'b1', name: 'Nike' });
  });
  it('list_spyder_brand_ads', async () => {
    const spy = mock(ok([]));
    await run({ action: listSpyderBrandAds, propsValue: { brandId: 'b1', languages: ['English'] } });
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ brand_id: 'b1', languages: 'English', limit: '10' });
  });
  it('get_spyder_top_ads', async () => {
    const spy = mock(ok({ pageId: '123', date: '2026-10-01', compareDaysAgo: 7, ads: [{ id: 'a1', ad_id: 'p1', rank: 1, previous_rank: 4 }] }));
    const out = await run({ action: getSpyderTopAds, propsValue: { pageId: '123', date: '2026-10-01' } });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/api/spyder/brand/rankings/123/top-overview?date=2026-10-01&compareDaysAgo=7`);
    expect(out).toMatchObject({ pageId: '123', compareDaysAgo: 7, count: 1 });
    expect(out.items[0]).toMatchObject({ id: 'a1', rank: 1, previousRank: 4, ad: null });
  });
  it('list_spyder_ranked_ads reads nested ranking and pagination', async () => {
    const spy = mock(ok({ page_id: '123', category: 'breakout', ads: [{ ...rawAd('a1'), ranking: { rank: 2, previous_rank: 9, peak_rank: 1, days_running: 12 } }], pagination: { offset: 0, limit: 1, total: 5, has_more: true }, counts: { all: 5 } }));
    const out = await run({ action: listSpyderRankedAds, propsValue: { pageId: '123', category: 'breakout', limit: 1 } });
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ category: 'breakout', limit: '1', offset: '0' });
    expect(out).toMatchObject({ pageId: '123', total: 5, hasMore: true, nextOffset: 1, counts: { all: 5 } });
    expect(out.items[0]).toMatchObject({ rank: 2, previousRank: 9, peakRank: 1, daysRunning: 12, ad: { id: 'a1' } });
  });
  it('list_spyder_related_pages', async () => {
    const spy = mock(ok({ results: [{ pageId: '9', pageName: 'Old', currentPageName: 'New', adsCount: 3 }] }));
    const out = await run({ action: listSpyderRelatedPages, propsValue: { pageId: '123' } });
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ pageId: '123', limit: '5' });
    expect(out.items[0]).toMatchObject({ pageId: '9', name: 'New', adsCount: 3 });
  });
  it('get_credit_usage omits the email', async () => {
    mock(ok({ start_date: '2026-10-01', end_date: '2026-11-01', total_credits: 1000, remaining_credits: 900, user: { id: 'u1', email: 'a@b.co' } }));
    const out = await run({ action: getCreditUsage, propsValue: {} });
    expect(out).toEqual({ totalCredits: 1000, remainingCredits: 900, usedCredits: 100, periodStart: '2026-10-01', periodEnd: '2026-11-01', userId: 'u1' });
  });
  it('get_lens_report', async () => {
    const spy = mock(okWith({ data: [{ core_metrics: { spend: 1 } }], metadata: { count: 11, pages: 2 } }));
    const out = await run({ action: getLensReport, propsValue: { lensId: '55', from: '2026-06-01', to: '2026-06-10', breakdownType: 'age,gender', provider: 'facebook', attrClick: '28d' } });
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ lens_id: '55', from: '2026-06-01', to: '2026-06-10', breakdown_type: 'age,gender', provider: 'facebook', attr_click: '28d', page: '1', limit: '10' });
    expect(out).toMatchObject({ count: 1, total: 11, hasMore: true, nextPage: 2 });
  });
});

describe('human actions keep raw output', () => {
  it('findAds returns raw ads and converts DateTime', async () => {
    const spy = mock(ok([rawAd('a1')]));
    const out = await run({ action: findAds, propsValue: { start_date: '2026-01-02T00:00:00.000Z', languages: ['english'], niches: ['health'], limit: 10 } });
    const url = urlOf(spy);
    expect(url.searchParams.get('start_date')).toBe('2026-01-02 00:00:00');
    expect(url.searchParams.get('languages')).toBe('english');
    expect(url.searchParams.get('niches')).toBe('health/wellness');
    expect(out).toEqual([rawAd('a1')]);
  });
  it('findAds maps legacy niches and drops retired ones without throwing', async () => {
    const spy = mock(ok([]));
    await run({ action: findAds, propsValue: { niches: ['technology', 'food', 'travel', 'finance', 'sports', 'automotive', 'beauty'] } });
    expect(urlOf(spy).searchParams.getAll('niches')).toEqual(['app/software', 'food/drink', 'beauty']);
  });
  it('findAds with only retired niches throws naming them', async () => {
    const spy = mock(ok([]));
    await expect(run({ action: findAds, propsValue: { niches: ['travel', 'sports'] } })).rejects.toThrow('"travel", "sports" are no longer supported');
    expect(spy).not.toHaveBeenCalled();
  });
  it('every niche offered on 0.1.9 is still a dropdown option', () => {
    const offered = JSON.stringify(findAds.props['niches']);
    for (const v of ['accessories', 'app/software', 'beauty', 'business/professional', 'education', 'entertainment', 'fashion', 'finance', 'food', 'health', 'home', 'pets', 'sports', 'technology', 'travel', 'automotive', 'other']) expect(offered).toContain(`"value":"${v}"`);
  });
  it('getAdsByPage', async () => {
    const spy = mock(ok([]));
    await run({ action: getAdsByPage, propsValue: { page_id: '123', display_format: ['page_like'] } });
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ page_id: '123', display_format: 'page_like' });
  });
  it('getAdById', async () => {
    const spy = mock(ok(rawAd('a1')));
    expect(await run({ action: getAdById, propsValue: { ad_id: 'a1' } })).toEqual(rawAd('a1'));
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/api/ad/a1`);
  });
  it('getAdById null data (internal id) throws a clear error', async () => {
    mock(ok(null));
    await expect(run({ action: getAdById, propsValue: { ad_id: 'internal1' } })).rejects.toThrow('public ad library ID');
  });
  it('findBrands allows up to 100', async () => {
    const spy = mock(ok([]));
    await run({ action: findBrands, propsValue: { query: 'nike', limit: 100 } });
    expect(urlOf(spy).searchParams.get('limit')).toBe('100');
  });
  it('findBoards without limit returns all boards', async () => {
    const spy = mock(ok([]));
    await run({ action: findBoards, propsValue: {} });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/api/boards`);
  });
  it('findBoards with limit pages', async () => {
    const spy = mock(ok([]));
    await run({ action: findBoards, propsValue: { limit: 10, offset: 0 } });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/api/boards?limit=10&offset=0`);
  });
});

describe('triggers', () => {
  const triggerArgs = ({ store, propsValue }: { store: ReturnType<typeof memoryStore>; propsValue: Record<string, unknown> }) => ({ auth, propsValue, store });

  it('keeps the legacy polling_interval prop on every trigger and ignores it', async () => {
    for (const t of [newAdInBoard, newAdInSpyder, newSwipefileAd]) expect(t.props['polling_interval']).toBeDefined();
    const store = memoryStore();
    const spy = mock(ok([]));
    await call({ target: newAdInBoard, method: 'onEnable', args: triggerArgs({ store, propsValue: { board_id: 'bd1', page_size: 3, polling_interval: 60 } }) });
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ board_id: 'bd1', order: 'newest', limit: '3' });
  });
  it('board trigger seeds, then emits only unseen ads oldest first', async () => {
    const store = memoryStore();
    const propsValue = { board_id: 'bd1', page_size: 3, live: 'true' };
    const spy = mock(ok([rawAd('a2'), rawAd('a1')]), ok([rawAd('a4'), rawAd('a3'), rawAd('a2')]), ok([rawAd('a4'), rawAd('a3'), rawAd('a2')]));
    await call({ target: newAdInBoard, method: 'onEnable', args: triggerArgs({ store, propsValue }) });
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ board_id: 'bd1', live: 'true', order: 'newest', limit: '3' });
    const first = await call({ target: newAdInBoard, method: 'run', args: triggerArgs({ store, propsValue }) });
    expect(first.map((a: { id: string }) => a.id)).toEqual(['a3', 'a4']);
    expect(first[0]).toMatchObject({ board_id: 'bd1' });
    const second = await call({ target: newAdInBoard, method: 'run', args: triggerArgs({ store, propsValue }) });
    expect(second).toEqual([]);
  });
  it('pages past a busy feed until it reaches a seen ad', async () => {
    const store = memoryStore();
    await store.put('foreplay_seen_ad_ids', ['a1']);
    const spy = mock(
      okWith({ data: [rawAd('a5'), rawAd('a4')], metadata: { cursor: 'c2' } }),
      okWith({ data: [rawAd('a3'), rawAd('a2')], metadata: { cursor: 'c3' } }),
      okWith({ data: [rawAd('a1'), rawAd('a0')], metadata: { cursor: 'c4' } }),
    );
    const out = await call({ target: newAdInBoard, method: 'run', args: triggerArgs({ store, propsValue: { board_id: 'bd1', page_size: 2 } }) });
    expect(out.map((a: { id: string }) => a.id)).toEqual(['a2', 'a3', 'a4', 'a5']);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(nthUrl({ spy, index: 1 }).searchParams.get('cursor')).toBe('c2');
    expect(nthUrl({ spy, index: 2 }).searchParams.get('cursor')).toBe('c3');
  });
  it('stops at the page cap and resumes the backlog on the next poll without losing ads', async () => {
    const store = memoryStore();
    await store.put('foreplay_seen_ad_ids', ['old']);
    const page = ({ id, cursor }: { id: string; cursor: string }) => okWith({ data: [rawAd(id)], metadata: { cursor } });
    const spy = mock(
      page({ id: 'n0', cursor: 'c1' }), page({ id: 'n1', cursor: 'c2' }), page({ id: 'n2', cursor: 'c3' }), page({ id: 'n3', cursor: 'c4' }), page({ id: 'n4', cursor: 'c5' }),
      page({ id: 'n5', cursor: 'c6' }), page({ id: 'old', cursor: 'c7' }),
      page({ id: 'n0', cursor: 'c1' }),
    );
    const props = { brand_id: 'b1', page_size: 1 };
    const first = await call({ target: newAdInSpyder, method: 'run', args: triggerArgs({ store, propsValue: props }) });
    expect(first.map((a: { id: string }) => a.id)).toEqual(['n4', 'n3', 'n2', 'n1', 'n0']);
    expect(store.data.get('foreplay_backlog_cursor')).toEqual({ cursor: 'c5', anchorIds: [], before: null, boundaryId: 'old' });
    const second = await call({ target: newAdInSpyder, method: 'run', args: triggerArgs({ store, propsValue: props }) });
    expect(nthUrl({ spy, index: 5 }).searchParams.get('cursor')).toBe('c5');
    expect(second.map((a: { id: string }) => a.id)).toEqual(['n5']);
    expect(store.data.has('foreplay_backlog_cursor')).toBe(false);
    expect(spy).toHaveBeenCalledTimes(8);
  });
  it('swipefile trigger pages by offset', async () => {
    const store = memoryStore();
    await store.put('foreplay_seen_ad_ids', ['s0']);
    const spy = mock(ok([rawAd('s2')]), ok([rawAd('s1')]), ok([rawAd('s0')]));
    const out = await call({ target: newSwipefileAd, method: 'run', args: triggerArgs({ store, propsValue: { page_size: 1 } }) });
    expect(out.map((a: { id: string }) => a.id)).toEqual(['s1', 's2']);
    expect([0, 1, 2].map((i) => nthUrl({ spy, index: i }).searchParams.get('offset'))).toEqual(['0', '1', '2']);
  });
  it('an upgraded trigger with only the old lastPoll emits ads newer than it, then dedupes by ID', async () => {
    const store = memoryStore();
    const lastPoll = Date.parse('2026-10-10T00:00:00Z');
    await store.put('lastPoll', lastPoll);
    const ads = [
      { ...rawAd('a3'), created_at: '2026-10-12T00:00:00Z' },
      { ...rawAd('a2'), created_at: '2026-10-11T00:00:00Z' },
      { ...rawAd('a1'), created_at: '2026-10-09T00:00:00Z' },
    ];
    mock(ok(ads), ok(ads));
    const out = await call({ target: newAdInBoard, method: 'run', args: triggerArgs({ store, propsValue: { board_id: 'bd1' } }) });
    expect(out.map((a: { id: string }) => a.id)).toEqual(['a2', 'a3']);
    expect(store.data.get('foreplay_seen_ad_ids')).toEqual(['a3', 'a2', 'a1']);
    expect(store.data.has('lastPoll')).toBe(false);
    const again = await call({ target: newAdInBoard, method: 'run', args: triggerArgs({ store, propsValue: { board_id: 'bd1' } }) });
    expect(again).toEqual([]);
  });
  it('a quiet upgrade keeps the boundary IDs so old ads are not replayed', async () => {
    const store = memoryStore();
    await store.put('lastPoll', Date.parse('2026-10-10T00:00:00Z'));
    const ads = [{ ...rawAd('a2'), created_at: '2026-10-09T00:00:00Z' }, { ...rawAd('a1'), created_at: '2026-10-08T00:00:00Z' }];
    mock(ok(ads), ok(ads));
    const first = await call({ target: newAdInBoard, method: 'run', args: triggerArgs({ store, propsValue: { board_id: 'bd1' } }) });
    expect(first).toEqual([]);
    expect(store.data.get('foreplay_seen_ad_ids')).toEqual(['a2', 'a1']);
    const second = await call({ target: newAdInBoard, method: 'run', args: triggerArgs({ store, propsValue: { board_id: 'bd1' } }) });
    expect(second).toEqual([]);
  });
  it('swipe-file backlog resumes at its anchor ad, so new saves that shift offsets cause no repeats', async () => {
    const store = memoryStore();
    await store.put('foreplay_seen_ad_ids', ['old']);
    const props = { page_size: 1 };
    const feed1 = ['s9', 's8', 's7', 's6', 's5', 's4', 's3', 'old'];
    const feed2 = ['n2', 'n1', ...feed1];
    const at = ({ feed, offsets }: { feed: string[]; offsets: number[] }) => offsets.map((o) => ok([rawAd(feed[o])]));
    const spy = mock(...at({ feed: feed1, offsets: [0, 1, 2, 3, 4] }), ...at({ feed: feed2, offsets: [4, 5, 6, 7, 8] }), ...at({ feed: feed2, offsets: [8, 9, 0, 1, 2] }));
    const first = await call({ target: newSwipefileAd, method: 'run', args: triggerArgs({ store, propsValue: props }) });
    expect(first.map((a: { id: string }) => a.id)).toEqual(['s5', 's6', 's7', 's8', 's9']);
    expect(store.data.get('foreplay_backlog_cursor')).toEqual({ cursor: '4', anchorIds: ['s5'], before: null, boundaryId: 'old' });
    const second = await call({ target: newSwipefileAd, method: 'run', args: triggerArgs({ store, propsValue: props }) });
    expect(second.map((a: { id: string }) => a.id)).toEqual(['s3', 's4']);
    expect(store.data.get('foreplay_backlog_cursor')).toEqual({ cursor: '8', anchorIds: ['s3'], before: null, boundaryId: 'old' });
    const third = await call({ target: newSwipefileAd, method: 'run', args: triggerArgs({ store, propsValue: props }) });
    expect(third.map((a: { id: string }) => a.id)).toEqual(['n1', 'n2']);
    expect(store.data.has('foreplay_backlog_cursor')).toBe(false);
    expect(spy.mock.calls.map((c) => new URL(String(c[0].url)).searchParams.get('offset'))).toEqual(['0', '1', '2', '3', '4', '4', '5', '6', '7', '8', '8', '9', '0', '1', '2']);
  });
  it('a swipe-file backlog whose anchor ads vanished still delivers the unread ads', async () => {
    const store = memoryStore();
    await store.put('foreplay_seen_ad_ids', ['s9', 'old']);
    await store.put('foreplay_backlog_cursor', { cursor: '1', anchorIds: ['gone'], before: null, boundaryId: 'old' });
    const feed = ['s9', 's4', 's3', 'old'];
    mock(...[1, 2, 3].map((o) => ok([rawAd(feed[o])])), ok([rawAd('s9')]));
    const out = await call({ target: newSwipefileAd, method: 'run', args: triggerArgs({ store, propsValue: { page_size: 1 } }) });
    expect(out.map((a: { id: string }) => a.id)).toEqual(['s3', 's4']);
    expect(store.data.has('foreplay_backlog_cursor')).toBe(false);
  });
  it('a swipe-file backlog with page size 3 resumes past every anchor instead of stopping at a seen one', async () => {
    const store = memoryStore();
    await store.put('foreplay_seen_ad_ids', ['old']);
    const feed = Array.from({ length: 17 }, (_, i) => `s${17 - i}`).concat('old');
    const page = (offset: number) => ok(feed.slice(offset, offset + 3).map((id) => rawAd(id)));
    mock(...[0, 3, 6, 9, 12].map(page), ...[12, 15, 0].map(page));
    const first = await call({ target: newSwipefileAd, method: 'run', args: triggerArgs({ store, propsValue: { page_size: 3 } }) });
    expect(first).toHaveLength(15);
    expect(store.data.get('foreplay_backlog_cursor')).toEqual({ cursor: '12', anchorIds: ['s5', 's4', 's3'], before: null, boundaryId: 'old' });
    const second = await call({ target: newSwipefileAd, method: 'run', args: triggerArgs({ store, propsValue: { page_size: 3 } }) });
    expect(second.map((a: { id: string }) => a.id)).toEqual(['s1', 's2']);
    expect(store.data.has('foreplay_backlog_cursor')).toBe(false);
  });
  it('keeps searching for its anchors across capped polls instead of replaying skipped ads', async () => {
    const store = memoryStore();
    await store.put('foreplay_seen_ad_ids', ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'old']);
    await store.put('foreplay_backlog_cursor', { cursor: '0', anchorIds: ['a'], before: null, boundaryId: 'old' });
    const feed = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'a', 'p1', 'old'];
    const at = (offsets: number[]) => offsets.map((o) => ok([rawAd(feed[o])]));
    mock(...at([0, 1, 2, 3, 4]), ...at([5, 6, 7, 8, 0]));
    const first = await call({ target: newSwipefileAd, method: 'run', args: triggerArgs({ store, propsValue: { page_size: 1 } }) });
    expect(first).toEqual([]);
    expect(store.data.get('foreplay_backlog_cursor')).toEqual({ cursor: '5', anchorIds: ['a'], before: null, boundaryId: 'old' });
    const second = await call({ target: newSwipefileAd, method: 'run', args: triggerArgs({ store, propsValue: { page_size: 1 } }) });
    expect(second.map((a: { id: string }) => a.id)).toEqual(['p1']);
  });
  it('every stored value stays far below the 512 KiB store limit', async () => {
    const store = memoryStore();
    const longId = ({ prefix, i }: { prefix: string; i: number }) => `${prefix}${String(i).padStart(63, '0')}`;
    await store.put('foreplay_seen_ad_ids', Array.from({ length: 1000 }, (_, i) => longId({ prefix: 'o', i })));
    const pages = Array.from({ length: 5 }, (_, p) => okWith({ data: Array.from({ length: 50 }, (_, i) => rawAd(longId({ prefix: 'n', i: p * 50 + i }))), metadata: { cursor: `c${p + 1}` } }));
    mock(...pages);
    await call({ target: newAdInBoard, method: 'run', args: triggerArgs({ store, propsValue: { board_id: 'bd1', page_size: 50 } }) });
    expect(store.data.get('foreplay_seen_ad_ids')).toHaveLength(1000);
    for (const value of store.data.values()) expect(JSON.stringify(value).length).toBeLessThan(100 * 1024);
  });
  it('a run without stored state (upgrade from 0.1.x) seeds silently', async () => {
    const store = memoryStore();
    mock(ok([rawAd('a1')]));
    const out = await call({ target: newAdInSpyder, method: 'run', args: triggerArgs({ store, propsValue: { brand_id: 'b1' } }) });
    expect(out).toEqual([]);
    expect(store.data.get('foreplay_seen_ad_ids')).toEqual(['a1']);
  });
  it('a failing poll throws instead of returning nothing', async () => {
    const store = memoryStore();
    await store.put('foreplay_seen_ad_ids', []);
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(httpFailure({ status: 401, body: { error: { message: 'Invalid or missing API key' } } }));
    await expect(call({ target: newSwipefileAd, method: 'run', args: triggerArgs({ store, propsValue: {} }) })).rejects.toThrow('Invalid or missing API key');
  });
  it('swipefile trigger orders by saved_newest and test fetches 5', async () => {
    const store = memoryStore();
    const spy = mock(ok([rawAd('s1')]));
    const out = await call({ target: newSwipefileAd, method: 'test', args: triggerArgs({ store, propsValue: {} }) });
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ order: 'saved_newest', limit: '5', offset: '0' });
    expect(out).toEqual([{ ...rawAd('s1'), metadata: { success: true, message: 'New ad detected' } }]);
  });
  it('onDisable keeps state', async () => {
    const store = memoryStore();
    await store.put('foreplay_seen_ad_ids', ['x']);
    await call({ target: newAdInSpyder, method: 'onDisable', args: triggerArgs({ store, propsValue: {} }) });
    expect(store.data.get('foreplay_seen_ad_ids')).toEqual(['x']);
  });
  it('onDisable then onEnable on a republish keeps the seen list and backlog', async () => {
    const store = memoryStore();
    await store.put('foreplay_seen_ad_ids', ['x']);
    await store.put('foreplay_backlog_cursor', { cursor: 'c1' });
    const spy = mock(ok([rawAd('n1')]));
    await call({ target: newAdInSpyder, method: 'onDisable', args: triggerArgs({ store, propsValue: { brand_id: 'br1' } }) });
    await call({ target: newAdInSpyder, method: 'onEnable', args: { ...triggerArgs({ store, propsValue: { brand_id: 'br1' } }), isRepublish: true } });
    expect(spy).not.toHaveBeenCalled();
    expect(store.data.get('foreplay_seen_ad_ids')).toEqual(['x']);
    expect(store.data.get('foreplay_backlog_cursor')).toEqual({ cursor: 'c1' });
  });
  it('onEnable on a republish with no seen list seeds', async () => {
    const store = memoryStore();
    mock(ok([rawAd('n1')]));
    await call({ target: newAdInSpyder, method: 'onEnable', args: { ...triggerArgs({ store, propsValue: { brand_id: 'br1' } }), isRepublish: true } });
    expect(store.data.get('foreplay_seen_ad_ids')).toEqual(['n1']);
  });
  it('onEnable without republish reseeds', async () => {
    const store = memoryStore();
    await store.put('foreplay_seen_ad_ids', ['x']);
    mock(ok([rawAd('n1')]));
    await call({ target: newAdInSpyder, method: 'onEnable', args: triggerArgs({ store, propsValue: { brand_id: 'br1' } }) });
    expect(store.data.get('foreplay_seen_ad_ids')).toEqual(['n1']);
  });
  it('board events carry title from the ad name', async () => {
    const store = memoryStore();
    await store.put('foreplay_seen_ad_ids', ['old']);
    mock(ok([{ ...rawAd('n1'), name: 'Ad N1' }, rawAd('old')]));
    const out = await call({ target: newAdInBoard, method: 'run', args: triggerArgs({ store, propsValue: { board_id: 'bd1' } }) });
    expect(out).toMatchObject([{ id: 'n1', title: 'Ad N1', board_id: 'bd1' }]);
  });
  it('board and swipefile events keep the legacy metadata fields', async () => {
    const legacy = { success: true, message: 'New ad detected' };
    const boardStore = memoryStore();
    await boardStore.put('foreplay_seen_ad_ids', ['old']);
    mock(ok([rawAd('n1'), rawAd('old')]));
    const board = await call({ target: newAdInBoard, method: 'run', args: triggerArgs({ store: boardStore, propsValue: { board_id: 'bd1' } }) });
    expect(board).toMatchObject([{ id: 'n1', board_id: 'bd1', metadata: legacy }]);
    const swipeStore = memoryStore();
    await swipeStore.put('foreplay_seen_ad_ids', ['old']);
    mock(ok([rawAd('s1'), rawAd('old')]));
    const swipe = await call({ target: newSwipefileAd, method: 'run', args: triggerArgs({ store: swipeStore, propsValue: {} }) });
    expect(swipe).toMatchObject([{ id: 's1', metadata: legacy }]);
    expect(newAdInBoard.sampleData).toMatchObject({ metadata: legacy });
    expect(newSwipefileAd.sampleData).toMatchObject({ metadata: legacy });
    for (const t of [newAdInBoard, newSwipefileAd]) {
      expect(t.outputSchema?.fields.map((f) => f.key)).toEqual(expect.arrayContaining(['metadata.success', 'metadata.message']));
    }
  });
  it('rejects a page size above 50', async () => {
    const store = memoryStore();
    await expect(call({ target: newAdInBoard, method: 'onEnable', args: triggerArgs({ store, propsValue: { board_id: 'bd1', page_size: 250 } }) })).rejects.toThrow('Ads Checked per Poll');
  });
  it('spyder dropdown pages through every brand', async () => {
    const spy = mock(ok(Array.from({ length: 10 }, (_, i) => ({ id: `b${i}`, name: `B${i}` }))), ok([{ id: 'b10', name: 'B10' }]));
    const prop = newAdInSpyder.props['brand_id'];
    const out = await call({ target: prop, method: 'options', args: { auth } });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(out.options).toHaveLength(11);
  });
  it('board dropdown shows the error reason', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(httpFailure({ status: 401, body: { error: { message: 'Invalid or missing API key' } } }));
    const out = await call({ target: newAdInBoard.props['board_id'], method: 'options', args: { auth } });
    expect(out).toMatchObject({ disabled: true });
    expect(out.placeholder).toContain('Invalid or missing API key');
  });
});

describe('auth', () => {
  it('valid key passes via the free usage endpoint', async () => {
    const spy = mock(ok({ total_credits: 1, remaining_credits: 1 }));
    const out = await call({ target: foreplayCoAuth, method: 'validate', args: { auth: 'k' } });
    expect(out).toEqual({ valid: true });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/api/usage`);
  });
  it('401 is invalid credentials', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(httpFailure({ status: 401, body: { error: { message: 'Invalid or missing API key' } } }));
    const out = await call({ target: foreplayCoAuth, method: 'validate', args: { auth: 'k' } });
    expect(out.valid).toBe(false);
    expect(out.error).toContain('Invalid credentials');
  });
  it('500 is not reported as bad credentials', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(httpFailure({ status: 500, body: { error: { message: 'boom' } } }));
    const out = await call({ target: foreplayCoAuth, method: 'validate', args: { auth: 'k' } });
    expect(out.error).toContain('boom');
    expect(out.error).not.toContain('Invalid credentials');
  });
});
