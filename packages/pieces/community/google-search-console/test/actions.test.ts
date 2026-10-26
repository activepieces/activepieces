import { afterEach, describe, expect, test, vi } from 'vitest';
import { addSite } from '../src/lib/actions/add-a-site';
import { deleteSiteBySiteUrl } from '../src/lib/actions/ai/delete-site-by-site-url';
import { deleteSitemapBySiteUrl } from '../src/lib/actions/ai/delete-sitemap-by-site-url';
import { getSite } from '../src/lib/actions/ai/get-site';
import { getSitemap } from '../src/lib/actions/ai/get-sitemap';
import { inspectUrlBySiteUrl } from '../src/lib/actions/ai/inspect-url-by-site-url';
import { listSitemapsBySiteUrl } from '../src/lib/actions/ai/list-sitemaps-by-site-url';
import { searchAnalyticsBySiteUrl } from '../src/lib/actions/ai/search-analytics-by-site-url';
import { submitSitemapBySiteUrl } from '../src/lib/actions/ai/submit-sitemap-by-site-url';
import { deleteSite } from '../src/lib/actions/delete-a-site';
import { deleteSitemap } from '../src/lib/actions/delete-a-sitemap';
import { listSitemaps } from '../src/lib/actions/list-sitemaps';
import { listSites } from '../src/lib/actions/list-sites';
import { searchAnalytics } from '../src/lib/actions/search-analytics';
import { submitSitemap } from '../src/lib/actions/submit-a-sitemap';
import { urlInspection } from '../src/lib/actions/url-inspection';
import { context, googleError, SITE, SITE_ENCODED, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

const SITES = '/webmasters/v3/sites';
const FEED = 'https://ap-gsc-delete-test.example.com/sitemap-ap-test.xml';
const FEED_ENCODED = 'https%3A%2F%2Fap-gsc-delete-test.example.com%2Fsitemap-ap-test.xml';

describe('sites', () => {
  test('list sites returns an empty list and count when Google omits siteEntry', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    expect(await listSites.run(context({}))).toEqual({ siteEntry: [], count: 0 });
    expect(seen[0].method).toBe('GET');
    expect(seen[0].rawPath).toBe(SITES);
  });

  test('get site reports permission and verification', async () => {
    const seen = stubFetch(() => ({ body: { siteUrl: SITE, permissionLevel: 'siteUnverifiedUser' } }));
    expect(await getSite.run(context({ site_url: 'https://ap-gsc-delete-test.example.com' }))).toEqual({
      site_url: SITE,
      permission_level: 'siteUnverifiedUser',
      is_verified: false,
    });
    expect(seen[0].rawPath).toBe(`${SITES}/${SITE_ENCODED}`);
  });

  test('add site PUTs then reads the permission level', async () => {
    const seen = stubFetch((request) => (request.method === 'PUT' ? { status: 204 } : { body: { siteUrl: SITE, permissionLevel: 'siteUnverifiedUser' } }));
    expect(await addSite.run(context({ siteUrl: 'https://ap-gsc-delete-test.example.com' }))).toEqual({ success: true, siteUrl: SITE, permissionLevel: 'siteUnverifiedUser' });
    expect(seen.map((request) => `${request.method} ${request.rawPath}`)).toEqual([`PUT ${SITES}/${SITE_ENCODED}`, `GET ${SITES}/${SITE_ENCODED}`]);
  });

  test('add site still succeeds when the follow-up read fails', async () => {
    stubFetch((request) => (request.method === 'PUT' ? { status: 204 } : { status: 503, body: googleError({ code: 503, message: 'backend' }) }));
    expect(await addSite.run(context({ siteUrl: SITE }))).toEqual({ success: true, siteUrl: SITE, permissionLevel: null });
  });

  test('add site still succeeds when the follow-up read hits a network error', async () => {
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) {
          return new Response(null, { status: 204 });
        }
        throw new TypeError('fetch failed');
      }),
    );
    expect(await addSite.run(context({ siteUrl: SITE }))).toEqual({ success: true, siteUrl: SITE, permissionLevel: null });
    expect(calls).toBe(2);
  });

  test('add site fails when the PUT fails', async () => {
    stubFetch(() => ({ status: 400, body: googleError({ code: 400, message: 'Invalid site URL', reason: 'invalid' }) }));
    await expect(addSite.run(context({ siteUrl: SITE }))).rejects.toThrow('Invalid site URL');
  });

  test('delete site, human and ai', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    expect(await deleteSite.run(context({ siteUrl: SITE }))).toEqual({ success: true, siteUrl: SITE });
    expect(await deleteSiteBySiteUrl.run(context({ site_url: 'sc-domain:example.com' }))).toEqual({ success: true, site_url: 'sc-domain:example.com' });
    expect(seen.map((request) => `${request.method} ${request.rawPath}`)).toEqual([`DELETE ${SITES}/${SITE_ENCODED}`, `DELETE ${SITES}/sc-domain%3Aexample.com`]);
  });

  test('a second delete surfaces the 404 instead of reporting success', async () => {
    stubFetch(() => ({ status: 404, body: googleError({ code: 404, message: `'${SITE}' is not a verified Search Console site in this account.`, reason: 'notFound' }) }));
    await expect(deleteSiteBySiteUrl.run(context({ site_url: SITE }))).rejects.toThrow('not found');
  });

  test('refuses a malformed site URL before any request', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(deleteSiteBySiteUrl.run(context({ site_url: 'example.com' }))).rejects.toThrow('not a Search Console property');
    expect(seen).toHaveLength(0);
  });
});

describe('sitemaps', () => {
  const rawSitemap = {
    path: FEED,
    lastSubmitted: '2026-10-01T10:00:00.000Z',
    isPending: true,
    isSitemapsIndex: false,
    type: 'sitemap',
    warnings: '0',
    errors: '2',
    contents: [{ type: 'web', submitted: '5', indexed: '0' }],
  };

  test('list sitemaps (human) keeps the raw items, adds a count and passes sitemapIndex', async () => {
    const seen = stubFetch(() => ({ body: { sitemap: [rawSitemap] } }));
    expect(await listSitemaps.run(context({ siteUrl: SITE, sitemapIndex: 'https://ap-gsc-delete-test.example.com/index.xml' }))).toEqual({ sitemap: [rawSitemap], count: 1 });
    expect(seen[0].rawPath).toBe(`${SITES}/${SITE_ENCODED}/sitemaps`);
    expect(seen[0].query.get('sitemapIndex')).toBe('https://ap-gsc-delete-test.example.com/index.xml');
  });

  test('list sitemaps returns [] when Google omits the key', async () => {
    stubFetch(() => ({ body: {} }));
    expect(await listSitemaps.run(context({ siteUrl: SITE }))).toEqual({ sitemap: [], count: 0 });
    expect(await listSitemapsBySiteUrl.run(context({ site_url: SITE }))).toEqual({ sitemaps: [], count: 0 });
  });

  test('list and get sitemap (ai) flatten counts to numbers', async () => {
    const seen = stubFetch((request) => (request.rawPath.endsWith('/sitemaps') ? { body: { sitemap: [rawSitemap] } } : { body: rawSitemap }));
    const listed = await listSitemapsBySiteUrl.run(context({ site_url: SITE }));
    expect(listed).toMatchObject({ count: 1, sitemaps: [{ path: FEED, errors: 2, warnings: 0, submitted_urls: 5, is_pending: true }] });
    const single = await getSitemap.run(context({ site_url: SITE, feedpath: FEED }));
    expect(single).toMatchObject({ path: FEED, errors: 2, submitted_urls: 5, last_downloaded: null });
    expect(seen[1].rawPath).toBe(`${SITES}/${SITE_ENCODED}/sitemaps/${FEED_ENCODED}`);
  });

  test('submit and delete sitemap send PUT/DELETE to the encoded feedpath', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    expect(await submitSitemap.run(context({ siteUrl: SITE, feedpath: FEED }))).toEqual({ success: true, siteUrl: SITE, feedpath: FEED });
    expect(await submitSitemapBySiteUrl.run(context({ site_url: SITE, feedpath: FEED }))).toEqual({ success: true, site_url: SITE, feedpath: FEED });
    expect(await deleteSitemap.run(context({ siteUrl: SITE, feedpath: FEED }))).toEqual({ success: true, siteUrl: SITE, feedpath: FEED });
    expect(await deleteSitemapBySiteUrl.run(context({ site_url: SITE, feedpath: FEED }))).toEqual({ success: true, site_url: SITE, feedpath: FEED });
    const target = `${SITES}/${SITE_ENCODED}/sitemaps/${FEED_ENCODED}`;
    expect(seen.map((request) => `${request.method} ${request.rawPath}`)).toEqual([`PUT ${target}`, `PUT ${target}`, `DELETE ${target}`, `DELETE ${target}`]);
  });

  test('submit refuses a relative sitemap path', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    await expect(submitSitemapBySiteUrl.run(context({ site_url: SITE, feedpath: 'sitemap.xml' }))).rejects.toThrow('full http(s) URL');
    expect(seen).toHaveLength(0);
  });

  test('a restricted user gets the permission hint', async () => {
    stubFetch(() => ({ status: 403, body: googleError({ code: 403, message: `User does not have sufficient permission for site '${SITE}'.` }) }));
    await expect(submitSitemapBySiteUrl.run(context({ site_url: SITE, feedpath: FEED }))).rejects.toThrow('Owner or Full permission');
  });
});

describe('search analytics', () => {
  const response = {
    rows: [
      { keys: ['shoes', 'https://ex.com/p'], clicks: 3, impressions: 40, ctr: 0.075, position: 4.2 },
      { keys: ['boots', 'https://ex.com/q'], clicks: 1, impressions: 10, ctr: 0.1, position: 8 },
    ],
    responseAggregationType: 'byPage',
  };

  test('human action sends the typed body and returns data, status and flattened rows', async () => {
    const seen = stubFetch(() => ({ body: response }));
    const result = await searchAnalytics.run(
      context({
        siteUrl: SITE,
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-09-30T00:00:00.000Z',
        dimensions: ['Query', 'page'],
        searchType: 'web',
        filters: [{ dimension: 'device', operator: 'equals', expression: 'mobile' }],
        rowLimit: 2,
      }),
    );
    expect(seen[0].method).toBe('POST');
    expect(seen[0].rawPath).toBe(`${SITES}/${SITE_ENCODED}/searchAnalytics/query`);
    expect(seen[0].json).toEqual({
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      dimensions: ['query', 'page'],
      type: 'web',
      dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'device', operator: 'equals', expression: 'MOBILE' }] }],
      rowLimit: 2,
    });
    expect(result).toEqual({
      data: response,
      status: 200,
      rows: [
        { query: 'shoes', page: 'https://ex.com/p', clicks: 3, impressions: 40, ctr: 0.075, position: 4.2 },
        { query: 'boots', page: 'https://ex.com/q', clicks: 1, impressions: 10, ctr: 0.1, position: 8 },
      ],
      row_count: 2,
    });
    expect(Object.keys(result)).not.toContain('config');
    expect(Object.keys(result)).not.toContain('headers');
  });

  test('human action normalises absent rows and sends hourly_all for hour', async () => {
    const seen = stubFetch(() => ({ body: { responseAggregationType: 'byProperty' } }));
    const result = await searchAnalytics.run(context({ siteUrl: SITE, startDate: '2026-10-01', endDate: '2026-10-05', dimensions: ['hour'] }));
    expect(Reflect.get(Object(seen[0].json), 'dataState')).toBe('hourly_all');
    expect(result).toMatchObject({ data: { rows: [], responseAggregationType: 'byProperty' }, rows: [], row_count: 0 });
  });

  test('human action validates row limit and dates before any request', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(searchAnalytics.run(context({ siteUrl: SITE, startDate: '2026-09-01', endDate: '2026-09-30', rowLimit: 30000 }))).rejects.toThrow('25,000');
    await expect(searchAnalytics.run(context({ siteUrl: SITE, startDate: '2026-09-30', endDate: '2026-09-01' }))).rejects.toThrow('after End Date');
    await expect(searchAnalytics.run(context({ siteUrl: SITE, startDate: undefined, endDate: '2026-09-01' }))).rejects.toThrow('required');
    expect(seen).toHaveLength(0);
  });

  test('ai action defaults to 28 days and 100 rows and reports paging', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-07T18:00:00Z'));
    const seen = stubFetch(() => ({ body: { ...response, metadata: { firstIncompleteDate: '2026-10-05' } } }));
    const result = await searchAnalyticsBySiteUrl.run(context({ site_url: SITE, dimensions: ['query', 'page'], data_state: 'all', row_limit: 2 }));
    vi.useRealTimers();
    expect(seen[0].json).toEqual({ startDate: '2026-09-09', endDate: '2026-10-06', dimensions: ['query', 'page'], dataState: 'all', rowLimit: 2, startRow: 0 });
    expect(result).toMatchObject({
      row_count: 2,
      has_more: true,
      next_start_row: 2,
      start_date: '2026-09-09',
      end_date: '2026-10-06',
      data_state: 'all',
      aggregation_type: 'byPage',
      first_incomplete_date: '2026-10-05',
      first_incomplete_hour: null,
    });
  });

  test('ai action caps rows at 1,000 and reports no more on a short page', async () => {
    const seen = stubFetch(() => ({ body: response }));
    await expect(searchAnalyticsBySiteUrl.run(context({ site_url: SITE, row_limit: 5000 }))).rejects.toThrow('from 1 to 1,000');
    const result = await searchAnalyticsBySiteUrl.run(context({ site_url: SITE, start_date: '2026-09-01', end_date: '2026-09-30', start_row: 100 }));
    expect(Reflect.get(Object(seen[0].json), 'rowLimit')).toBe(100);
    expect(Reflect.get(Object(seen[0].json), 'startRow')).toBe(100);
    expect(result).toMatchObject({ has_more: false, next_start_row: null, data_state: 'final' });
  });
});

describe('url inspection', () => {
  const body = { inspectionResult: { inspectionResultLink: 'https://search.google.com/x', indexStatusResult: { verdict: 'NEUTRAL', coverageState: 'URL is unknown to Google' } } };

  test('human action posts to v1 with languageCode and returns the raw result', async () => {
    const seen = stubFetch(() => ({ body }));
    const result = await urlInspection.run(context({ siteUrl: SITE, url: 'https://ap-gsc-delete-test.example.com/a', languageCode: 'de' }));
    expect(seen[0].url).toBe('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect');
    expect(seen[0].json).toEqual({ inspectionUrl: 'https://ap-gsc-delete-test.example.com/a', siteUrl: SITE, languageCode: 'de' });
    expect(result).toEqual(body);
  });

  test('ai action flattens and refuses a URL outside the property', async () => {
    const seen = stubFetch(() => ({ body }));
    await expect(inspectUrlBySiteUrl.run(context({ site_url: SITE, inspection_url: 'https://other.example.com/a' }))).rejects.toThrow('not part of the property');
    expect(seen).toHaveLength(0);
    const result = await inspectUrlBySiteUrl.run(context({ site_url: SITE, inspection_url: 'https://ap-gsc-delete-test.example.com/a' }));
    expect(seen[0].json).toEqual({ inspectionUrl: 'https://ap-gsc-delete-test.example.com/a', siteUrl: SITE });
    expect(result).toMatchObject({ verdict: 'NEUTRAL', coverage_state: 'URL is unknown to Google', referring_urls: [], rich_result_issues: [], inspection_result_link: 'https://search.google.com/x' });
  });
});
