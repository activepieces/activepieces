import { describe, expect, test } from 'vitest';
import { gscInputs } from '../src/lib/common/inputs';
import { gscShape } from '../src/lib/common/shape';

describe('siteUrl', () => {
  test('normalises URL-prefix and domain properties', () => {
    expect(gscInputs.siteUrl({ value: ' https://www.example.com ' })).toBe('https://www.example.com/');
    expect(gscInputs.siteUrl({ value: 'https://example.com/blog' })).toBe('https://example.com/blog/');
    expect(gscInputs.siteUrl({ value: 'http://example.com/' })).toBe('http://example.com/');
    expect(gscInputs.siteUrl({ value: 'sc-domain:example.com' })).toBe('sc-domain:example.com');
    expect(gscInputs.siteUrl({ value: 'SC-DOMAIN: example.com' })).toBe('sc-domain:example.com');
  });

  test('refuses anything else', () => {
    expect(() => gscInputs.siteUrl({ value: '' })).toThrow('required');
    expect(() => gscInputs.siteUrl({ value: 'example.com' })).toThrow('not a Search Console property');
    expect(() => gscInputs.siteUrl({ value: 'https://example.com/?a=1' })).toThrow('not a Search Console property');
    expect(() => gscInputs.siteUrl({ value: 'sc-domain:https://example.com' })).toThrow('not a valid domain property');
    expect(() => gscInputs.siteUrl({ value: 'ftp://example.com/' })).toThrow('not a Search Console property');
  });
});

describe('urls', () => {
  test('urlInProperty checks prefix and domain properties', () => {
    expect(gscInputs.urlInProperty({ value: 'https://example.com/blog/a', label: 'URL', site: 'https://example.com/blog/' })).toBe('https://example.com/blog/a');
    expect(() => gscInputs.urlInProperty({ value: 'https://example.com/shop', label: 'URL', site: 'https://example.com/blog/' })).toThrow('not part of the property');
    expect(() => gscInputs.urlInProperty({ value: 'http://example.com/blog/a', label: 'URL', site: 'https://example.com/blog/' })).toThrow('not part of the property');
    expect(gscInputs.urlInProperty({ value: 'https://shop.example.com/x', label: 'URL', site: 'sc-domain:example.com' })).toBe('https://shop.example.com/x');
    expect(() => gscInputs.urlInProperty({ value: 'https://example.com.evil.io/x', label: 'URL', site: 'sc-domain:example.com' })).toThrow('not part of the property');
  });

  test('absoluteUrl refuses relative paths and credentials', () => {
    expect(() => gscInputs.absoluteUrl({ value: '/sitemap.xml', label: 'Sitemap URL' })).toThrow('full http(s) URL');
    expect(() => gscInputs.absoluteUrl({ value: 'https://user:pw@example.com/s.xml', label: 'Sitemap URL' })).toThrow('full http(s) URL');
  });

  test('languageCode', () => {
    expect(gscInputs.languageCode({ value: '' })).toBeUndefined();
    expect(gscInputs.languageCode({ value: 'pt-BR' })).toBe('pt-BR');
    expect(() => gscInputs.languageCode({ value: 'english please' })).toThrow('BCP-47');
  });
});

describe('dates', () => {
  test('takes the literal date part without a time zone shift', () => {
    expect(gscInputs.date({ value: '2026-09-01T23:30:00.000Z', label: 'Start Date' })).toBe('2026-09-01');
    expect(gscInputs.date({ value: '2026-09-01', label: 'Start Date' })).toBe('2026-09-01');
    expect(() => gscInputs.date({ value: '2026-02-30', label: 'Start Date' })).toThrow('real calendar date');
    expect(() => gscInputs.date({ value: '09/01/2026', label: 'Start Date' })).toThrow('YYYY-MM-DD');
  });

  test('requiredDateRange checks order', () => {
    expect(gscInputs.requiredDateRange({ startDate: '2026-09-01', endDate: '2026-09-30' })).toEqual({ startDate: '2026-09-01', endDate: '2026-09-30' });
    expect(() => gscInputs.requiredDateRange({ startDate: '2026-09-30', endDate: '2026-09-01' })).toThrow('after End Date');
    expect(() => gscInputs.requiredDateRange({ startDate: undefined, endDate: '2026-09-01' })).toThrow('required');
  });

  test('dateRange defaults to the last 28 days ending yesterday', () => {
    expect(gscInputs.dateRange({ startDate: undefined, endDate: undefined, today: '2026-10-07' })).toEqual({ startDate: '2026-09-09', endDate: '2026-10-06' });
    expect(gscInputs.dateRange({ startDate: '', endDate: '', lastNDays: 7, today: '2026-03-02' })).toEqual({ startDate: '2026-02-23', endDate: '2026-03-01' });
    expect(gscInputs.dateRange({ startDate: '2026-09-01', endDate: undefined, today: '2026-10-07' })).toEqual({ startDate: '2026-09-01', endDate: '2026-10-06' });
    expect(() => gscInputs.dateRange({ startDate: '2026-09-01', endDate: undefined, lastNDays: 7 })).toThrow('not both');
    expect(() => gscInputs.dateRange({ startDate: undefined, endDate: '2026-09-01' })).toThrow('Start Date is required');
    expect(() => gscInputs.dateRange({ startDate: undefined, endDate: undefined, lastNDays: 0 })).toThrow('from 1 to 500');
  });

  test('pacificToday uses Pacific Time', () => {
    expect(gscInputs.pacificToday(new Date('2026-10-07T05:00:00Z'))).toBe('2026-10-06');
    expect(gscInputs.pacificToday(new Date('2026-10-07T09:00:00Z'))).toBe('2026-10-07');
  });
});

describe('numbers', () => {
  test('optionalInteger accepts integers and numeric strings in range', () => {
    expect(gscInputs.optionalInteger({ value: undefined, label: 'Row Limit', min: 1, max: 25000 })).toBeUndefined();
    expect(gscInputs.optionalInteger({ value: '250', label: 'Row Limit', min: 1, max: 25000 })).toBe(250);
    expect(gscInputs.optionalInteger({ value: 25000, label: 'Row Limit', min: 1, max: 25000 })).toBe(25000);
    expect(() => gscInputs.optionalInteger({ value: 25001, label: 'Row Limit', min: 1, max: 25000 })).toThrow('from 1 to 25,000');
    expect(() => gscInputs.optionalInteger({ value: 1.5, label: 'Row Limit', min: 1, max: 25000 })).toThrow('whole number');
    expect(() => gscInputs.optionalInteger({ value: -1, label: 'Start Row', min: 0, max: 10 })).toThrow('whole number');
    expect(() => gscInputs.optionalInteger({ value: 'ten', label: 'Start Row', min: 0, max: 10 })).toThrow('whole number');
  });
});

describe('analytics query', () => {
  test('normalises dimension case and refuses unknown or duplicate ones', () => {
    expect(gscInputs.dimensions({ value: ['Query', 'SEARCHAPPEARANCE', 'date'] })).toEqual(['query', 'searchAppearance', 'date']);
    expect(gscInputs.dimensions({ value: undefined })).toEqual([]);
    expect(() => gscInputs.dimensions({ value: ['queries'] })).toThrow('not supported');
    expect(() => gscInputs.dimensions({ value: ['page', 'Page'] })).toThrow('only once');
  });

  test('filters are validated and device is upper-cased', () => {
    expect(gscInputs.filters({ value: [{ dimension: 'device', operator: 'equals', expression: 'mobile' }] })).toEqual([{ dimension: 'device', operator: 'equals', expression: 'MOBILE' }]);
    expect(() => gscInputs.filters({ value: [{ dimension: 'date', operator: 'equals', expression: 'x' }] })).toThrow('Filter 1: dimension');
    expect(() => gscInputs.filters({ value: [{ dimension: 'query', operator: 'like', expression: 'x' }] })).toThrow('Filter 1: operator');
    expect(() => gscInputs.filters({ value: [{ dimension: 'query', operator: 'contains', expression: ' ' }] })).toThrow('expression is empty');
  });

  const base = { startDate: '2026-09-01', endDate: '2026-09-30', searchType: undefined, filters: [], aggregationType: undefined, dataState: undefined, rowLimit: undefined, startRow: undefined };

  test('hour forces hourly_all and rejects another data state', () => {
    expect(gscInputs.analyticsQuery({ ...base, dimensions: ['hour'] }).dataState).toBe('hourly_all');
    expect(() => gscInputs.analyticsQuery({ ...base, dimensions: ['hour'], dataState: 'final' })).toThrow('hourly_all');
    expect(gscInputs.analyticsQuery({ ...base, dimensions: ['date'], dataState: 'all' }).dataState).toBe('all');
  });

  test('refuses incompatible combinations before any request', () => {
    expect(() => gscInputs.analyticsQuery({ ...base, dimensions: ['page'], aggregationType: 'byProperty' })).toThrow('byProperty');
    expect(() =>
      gscInputs.analyticsQuery({ ...base, dimensions: [], aggregationType: 'byProperty', filters: [{ dimension: 'page', operator: 'contains', expression: '/blog' }] }),
    ).toThrow('byProperty');
    expect(() => gscInputs.analyticsQuery({ ...base, dimensions: ['query'], searchType: 'discover' })).toThrow('no search queries');
    expect(() => gscInputs.analyticsQuery({ ...base, dimensions: [], aggregationType: 'byNewsShowcasePanel', searchType: 'web' })).toThrow('byNewsShowcasePanel');
    expect(() => gscInputs.analyticsQuery({ ...base, dimensions: [], searchType: 'shopping' })).toThrow('Search Type');
  });

  test('builds the request body with only the fields that are set', () => {
    expect(gscInputs.analyticsQuery({ ...base, dimensions: [] })).toEqual({ startDate: '2026-09-01', endDate: '2026-09-30' });
    expect(
      gscInputs.analyticsQuery({
        ...base,
        dimensions: ['query', 'page'],
        searchType: 'web',
        filters: [{ dimension: 'country', operator: 'equals', expression: 'usa' }],
        aggregationType: 'byPage',
        rowLimit: 10,
        startRow: 20,
      }),
    ).toEqual({
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      dimensions: ['query', 'page'],
      type: 'web',
      dimensionFilterGroups: [{ groupType: 'and', filters: [{ dimension: 'country', operator: 'equals', expression: 'usa' }] }],
      aggregationType: 'byPage',
      rowLimit: 10,
      startRow: 20,
    });
  });
});

describe('shape', () => {
  test('analytics rows get one named column per dimension and numeric metrics', () => {
    expect(
      gscShape.analyticsRow({ row: { keys: ['buy shoes', 'https://ex.com/p'], clicks: 12, impressions: 340, ctr: 0.0353, position: 7.4 }, dimensions: ['query', 'page'] }),
    ).toEqual({ query: 'buy shoes', page: 'https://ex.com/p', clicks: 12, impressions: 340, ctr: 0.0353, position: 7.4 });
    expect(gscShape.analyticsRow({ row: { clicks: 1, impressions: 2, ctr: 0.5, position: 3 }, dimensions: [] })).toEqual({ clicks: 1, impressions: 2, ctr: 0.5, position: 3 });
    expect(gscShape.analyticsRow({ row: { keys: ['DESKTOP'] }, dimensions: ['searchAppearance'] })).toMatchObject({ search_appearance: 'DESKTOP' });
    expect(gscShape.analyticsRow({ row: { keys: ['2026-09-26'], clicks: 0, impressions: 0, ctr: 0, position: 0 }, dimensions: ['date'] })).toEqual({ date: '2026-09-26', clicks: 0, impressions: 0, ctr: 0, position: null });
  });

  test('sitemap counts become numbers', () => {
    expect(
      gscShape.sitemapFlat({
        path: 'https://ex.com/sitemap.xml',
        lastSubmitted: '2026-10-01T10:00:00.000Z',
        isPending: false,
        isSitemapsIndex: false,
        type: 'sitemap',
        lastDownloaded: '2026-10-02T10:00:00.000Z',
        warnings: '1',
        errors: '0',
        contents: [
          { type: 'web', submitted: '12', indexed: '0' },
          { type: 'image', submitted: '3' },
        ],
      }),
    ).toEqual({
      path: 'https://ex.com/sitemap.xml',
      type: 'sitemap',
      is_sitemaps_index: false,
      is_pending: false,
      last_submitted: '2026-10-01T10:00:00.000Z',
      last_downloaded: '2026-10-02T10:00:00.000Z',
      errors: 0,
      warnings: 1,
      submitted_urls: 15,
      contents: [
        { type: 'web', submitted: 12 },
        { type: 'image', submitted: 3 },
      ],
    });
  });

  test('inspection is flattened and referring URLs are capped', () => {
    const referringUrls = Array.from({ length: 25 }, (_, index) => `https://ex.com/r${index}`);
    const flat = gscShape.inspection({
      inspectedUrl: 'https://ex.com/a',
      body: {
        inspectionResult: {
          inspectionResultLink: 'https://search.google.com/search-console/inspect?resource_id=x',
          indexStatusResult: { verdict: 'PASS', coverageState: 'Submitted and indexed', sitemap: ['https://ex.com/sitemap.xml'], referringUrls, lastCrawlTime: '2026-10-01T00:00:00Z' },
          richResultsResult: {
            verdict: 'PARTIAL',
            detectedItems: [{ richResultType: 'Breadcrumbs', items: [{ name: 'Unnamed item', issues: [{ issueMessage: 'Missing field "item"', severity: 'WARNING' }] }] }],
          },
          mobileUsabilityResult: { verdict: 'VERDICT_UNSPECIFIED' },
        },
      },
    });
    expect(flat).toMatchObject({
      inspected_url: 'https://ex.com/a',
      verdict: 'PASS',
      coverage_state: 'Submitted and indexed',
      sitemaps: ['https://ex.com/sitemap.xml'],
      referring_urls_truncated: true,
      rich_results_verdict: 'PARTIAL',
      rich_result_types: ['Breadcrumbs'],
      rich_result_issues: [{ type: 'Breadcrumbs', item: 'Unnamed item', severity: 'WARNING', message: 'Missing field "item"' }],
      amp_verdict: null,
      mobile_usability_verdict: 'VERDICT_UNSPECIFIED',
    });
    expect(flat.referring_urls).toHaveLength(20);
  });
});
