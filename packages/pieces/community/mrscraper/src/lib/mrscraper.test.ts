import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mrscraper } from '..';
import { mrscraperAuth } from './auth';
import { mrscraperApi } from './common/http';
import { mrscraperPayloads } from './common/payloads';

const FAKE_TOKEN = 'mrs_test_conspicuously_fake_123';
const ACTION_NAMES = [
  'mrscraper_get_account_info',
  'mrscraper_crawl_website_urls',
  'mrscraper_search_google_serp',
  'mrscraper_extract_page_by_prompt',
  'mrscraper_extract_listings',
  'mrscraper_extract_structured_data',
  'mrscraper_fetch_rendered_html',
  'mrscraper_get_results',
  'mrscraper_get_latest_results',
  'mrscraper_get_result_detail',
  'mrscraper_create_prompt_scraper',
  'mrscraper_create_listing_scraper',
  'mrscraper_create_website_crawl_scraper',
  'mrscraper_run_existing_scraper',
  'mrscraper_run_existing_scraper_batch',
];

let sendRequest: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  sendRequest = vi.spyOn(httpClient, 'sendRequest');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('piece definition', () => {
  it('registers exactly the 15 stable actions and no triggers', () => {
    const actions = Object.values(mrscraper.actions());
    expect(actions.map((action) => action.name)).toEqual(ACTION_NAMES);
    expect(new Set(actions.map((action) => action.name)).size).toBe(15);
    expect(actions.every((action) => action.description.length > 0)).toBe(true);
    expect(actions.every((action) => action.audience === 'both')).toBe(true);
    expect(actions.every((action) => action.aiMetadata?.description)).toBe(true);
    expect(actions.every((action) => action.classification)).toBe(true);
    expect(Object.keys(mrscraper.triggers())).toHaveLength(0);
    expect(mrscraperAuth.displayName).toBe('API Token');
    expect(mrscraperAuth.required).toBe(true);
    expect(mrscraperAuth.type).toBe('SECRET_TEXT');
  });

  it('exposes representative property types, enums, defaults, and required fields', () => {
    const serp = mrscraper.getAction('mrscraper_search_google_serp');
    const rendered = mrscraper.getAction('mrscraper_fetch_rendered_html');
    const batch = mrscraper.getAction('mrscraper_run_existing_scraper_batch');
    expect(serp?.props['query'].required).toBe(true);
    expect(serp?.props['page'].type).toBe('NUMBER');
    expect(serp?.props['page'].defaultValue).toBe(1);
    expect(serp?.props['format'].defaultValue).toBe('json');
    expect(serp?.props['format'].options.options.map((option) => option.value)).toEqual(['json', 'html']);
    expect(rendered?.props['screenshot'].defaultValue).toBe(false);
    expect(rendered?.props['screenshot_mode'].defaultValue).toBe('full');
    expect(rendered?.props['html'].defaultValue).toBe(false);
    const runExisting = mrscraper.getAction('mrscraper_run_existing_scraper');
    expect(runExisting?.props['agent_type'].displayOptions?.show).toEqual({ scraper_type: ['ai'] });
    expect(runExisting?.props['cookie_jar'].displayOptions?.show).toEqual({ scraper_type: ['manual'] });
    expect(runExisting?.props['max_depth'].displayOptions?.show).toEqual({ scraper_type: ['ai'], agent_type: ['map'] });
    expect(runExisting?.props['html'].advanced).toBe(true);
    expect(runExisting?.props['wait_for_selector'].advanced).toBe(true);
    expect(runExisting?.props['cookie_jar'].advanced).toBe(true);
    expect(runExisting?.props['token_cap'].advanced).toBe(true);
    expect(runExisting?.propertyGroups).toEqual([
      { key: 'run', display: 'section', label: 'Run', icon: 'send', props: ['scraper_type', 'scraper_id', 'url', 'max_retry', 'proxy_country', 'agent_type', 'timeout'] },
      { key: 'ai_configuration', display: 'section', label: 'AI Scraper Configuration', icon: 'sliders', props: ['max_pages', 'max_depth', 'limit', 'include_patterns', 'exclude_patterns'] },
    ]);
    expect(batch?.props['urls'].type).toBe('ARRAY');
    expect(batch?.props['urls'].required).toBe(true);
  });
});

describe('payload validation and mappings', () => {
  it('builds map payloads and preserves zero and blank omission', () => {
    expect(mrscraperPayloads.map({ url: 'https://example.com', max_depth: 0, max_pages: 0, limit: 1, include_patterns: ' ' })).toEqual({
      graph: 'map', url: 'https://example.com/', maxDepth: 0, maxPages: 0, limit: 1,
    });
    expect(() => mrscraperPayloads.map({ url: '', limit: 1 })).toThrow('nonblank');
    expect(() => mrscraperPayloads.map({ url: 'https://example.com', max_depth: 1.5, limit: 1 })).toThrow('integer');
    expect(() => mrscraperPayloads.map({ url: 'https://example.com', limit: 0 })).toThrow('at least 1');
    expect(() => mrscraperPayloads.serp({ query: 'hotels', region: 'usa' })).toThrow('two-letter code');
  });

  it('appends compact schemas once with exact operation labels', () => {
    const general = mrscraperPayloads.general({ url: 'https://example.com', prompt: 'Extract', output_schema: { price: 'number' } });
    const listing = mrscraperPayloads.listing({ url: 'https://example.com', prompt: 'Extract', output_schema: { title: 'string' } });
    expect(general['message']).toBe('Extract\n\nReturn the output as JSON matching this schema:\n{"price":"number"}');
    expect(listing['message']).toBe('Extract\n\nReturn each item as JSON matching this schema:\n{"title":"string"}');
    expect(mrscraperPayloads.appendSchema({ prompt: general['message'], schema: { price: 'number' }, label: 'Return the output as JSON matching this schema:' })).toBe(general['message']);
  });

  it('uses every structured preset byte-for-byte', () => {
    for (const category of Object.keys(mrscraperPayloads.structuredDataPrompts)) {
      const payload = mrscraperPayloads.structured({ url: 'https://example.com', category });
      expect(payload['message']).toBe(mrscraperPayloads.structuredDataPrompts[category]);
    }
    expect(Object.keys(mrscraperPayloads.structuredDataPrompts)).toHaveLength(10);
  });

  it('omits inactive rendered-page options and includes active options', () => {
    const request = mrscraperPayloads.renderedRequest({
      url: 'https://example.com', max_retries: 0, timeout: 1, html: false, markdown: false,
      screenshot: false, block_resources: false, home_page: false, return_cookie: false,
      super_mode: false, token_cap: 1, wait_for_selector: ' ',
    });
    expect(request.queryParams).toEqual({
      timeout: '1', geoCode: 'us', proxyCountry: 'us',
    });
    expect(request.body).toEqual({ url: 'https://example.com/', maxRetries: 0, tokenCap: 1 });
    expect(request.queryParams['screenshot']).toBeUndefined();
    const screenshot = mrscraperPayloads.renderedRequest({ url: 'https://example.com', screenshot: true, screenshot_mode: 'top' });
    expect(screenshot.queryParams['screenshot']).toBe('top');
  });

  it('maps results filters, sorting, and latest-result defaults', () => {
    expect(mrscraperPayloads.resultsQuery({ scraper_id: 'scraper-1', page: 2, page_size: 0, sort_by: 'createdAt', sort_order: 'ASC' })).toEqual({
      'filters[scraperId]': 'scraper-1', page: '2', pageSize: '0', sort: 'createdAt', sortOrder: 'ASC',
    });
    expect(mrscraperPayloads.latestQuery({ scraper_id: 'scraper-1' })).toEqual({
      'filters[scraperId]': 'scraper-1', page: '1', pageSize: '10', sort: 'createdAt', sortOrder: 'DESC',
    });
    expect(mrscraperPayloads.detailPath('result/a b')).toBe('/api/v1/results/result%2Fa%20b');
  });

  it('switches AI run modes and ignores hidden values', () => {
    const general = mrscraperPayloads.singleRun({ scraper_type: 'ai', scraper_id: 's1', url: 'https://example.com', max_retry: 0, agent_type: 'general', html: false });
    expect(general.path).toBe('/api/v1/scrapers-ai-rerun');
    expect(general.body).toEqual({ scraperId: 's1', url: 'https://example.com/', maxRetry: 0 });
    const listing = mrscraperPayloads.singleRun({ scraper_type: 'ai', scraper_id: 's1', url: 'https://example.com', agent_type: 'listing', max_pages: 1, timeout: 1, stream: false });
    expect(listing.body).toMatchObject({ maxPages: 1, timeout: 1 });
    expect(listing.body['stream']).toBeUndefined();
    const map = mrscraperPayloads.singleRun({ scraper_type: 'ai', scraper_id: 's1', url: 'https://example.com', agent_type: 'map', max_depth: 0, max_pages: 1, limit: 1 });
    expect(map.body).toMatchObject({ maxDepth: 0, maxPages: 1, limit: 1 });
    expect(mrscraperPayloads.singleRun({ scraper_type: 'ai', scraper_id: 's1', url: 'https://example.com', agent_type: 'general', stream: true }).body['stream']).toBeUndefined();
    expect(mrscraperPayloads.singleRun({ scraper_type: 'ai', scraper_id: 's1', url: 'https://example.com', agent_type: 'map', html: true }).body['html']).toBeUndefined();
    expect(() => mrscraperPayloads.singleRun({ scraper_type: 'other', scraper_id: 's1', url: 'https://example.com' })).toThrow('must be one of');
  });

  it('serializes only active Manual settings and ignores AI fields', () => {
    const manual = mrscraperPayloads.singleRun({
      scraper_type: 'manual', scraper_id: 's1', url: 'https://example.com', max_retry: 0,
      cookies: [{ name: 'session', value: 'fake' }], paginator: {}, screenshot: false, token_cap: 0,
    });
    expect(manual.path).toBe('/api/v1/scrapers-manual-rerun');
    expect(manual.body).toMatchObject({ maxRetry: 0, cookies: [{ name: 'session', value: 'fake' }], paginator: {}, tokenCap: 0 });
    expect(manual.body['screenshot']).toBeUndefined();
    expect(manual.body['bypassProxy']).toBeUndefined();
    expect(manual.body['agentType']).toBeUndefined();
    expect(mrscraperPayloads.singleRun({ scraper_type: 'manual', scraper_id: 's1', url: 'https://example.com', agent_type: 'general' }).body['agentType']).toBeUndefined();
    expect(mrscraperPayloads.singleRun({ scraper_type: 'ai', scraper_id: 's1', url: 'https://example.com', cookie_jar: 'jar' }).body['cookieJar']).toBeUndefined();
  });

  it('normalizes batch URLs and rejects empty batches', () => {
    expect(mrscraperPayloads.batchRun({ scraper_type: 'manual', scraper_id: 's1', urls: '["https://one.example","https://two.example"]' })).toEqual({
      path: '/api/v1/scrapers-manual-rerun/bulk',
      body: { scraperId: 's1', urls: ['https://one.example/', 'https://two.example/'] },
    });
    expect(mrscraperPayloads.batchRun({ scraper_type: 'ai', scraper_id: 's1', urls: 'https://one.example,\nhttps://two.example' }).path).toBe('/api/v1/scrapers-ai-rerun/bulk');
    expect(() => mrscraperPayloads.batchRun({ scraper_type: 'ai', scraper_id: 's1', urls: [] })).toThrow('at least one');
  });
});

describe('HTTP and authentication', () => {
  it('uses primary x-api-token auth and preserves upstream JSON', async () => {
    const body = { id: 'result-1', nested: { untouched: true } };
    sendRequest.mockResolvedValue({ status: 200, headers: {}, body });
    await expect(mrscraperApi.request({ token: FAKE_TOKEN, origin: 'primary', method: HttpMethod.GET, path: '/api/v1/results' })).resolves.toBe(body);
    const request = sendRequest.mock.calls[0][0];
    expect(request.url).toBe('https://api.app.mrscraper.com/api/v1/results');
    expect(request.headers?.['x-api-token']).toBe(FAKE_TOKEN);
    expect(request.retries).toBe(0);
    expect(request.timeout).toBeGreaterThan(0);
  });

  it('uses Bearer auth for SERP and preserves HTML text', async () => {
    sendRequest.mockResolvedValue({ status: 200, headers: {}, body: '<html>ok</html>' });
    const result = await mrscraperApi.request({ token: FAKE_TOKEN, origin: 'serp', method: HttpMethod.POST, path: '/api/google/serp/v2/sync', responseType: 'text', body: { renderJs: false } });
    const request = sendRequest.mock.calls[0][0];
    expect(request.url).toBe('https://sync.scraper.mrscraper.com/api/google/serp/v2/sync');
    expect(request.headers?.['Authorization']).toBe(`Bearer ${FAKE_TOKEN}`);
    expect(request.body).toEqual({ renderJs: false });
    expect(result).toBe('<html>ok</html>');
  });

  it('puts rendered auth in mandatory query parameters', async () => {
    sendRequest.mockResolvedValue({ status: 200, headers: {}, body: 'plain text' });
    await expect(mrscraperApi.request({ token: FAKE_TOKEN, origin: 'rendered', method: HttpMethod.POST, path: '/', body: { url: 'https://example.com' }, queryParams: { html: 'true' } })).resolves.toBe('plain text');
    const request = sendRequest.mock.calls[0][0];
    expect(request.url).toBe('https://api.mrscraper.com/');
    expect(request.queryParams).toEqual({ token: FAKE_TOKEN, browserRendering: 'true', html: 'true' });
    expect(request.headers?.['x-api-token']).toBeUndefined();
  });

  it('validates successful and failed connections safely', async () => {
    if (mrscraperAuth.validate === undefined) throw new Error('Auth validator is missing.');
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { ok: true } });
    await expect(mrscraperAuth.validate({ auth: FAKE_TOKEN, server: { apiUrl: '', publicUrl: '' } })).resolves.toEqual({ valid: true });
    sendRequest.mockRejectedValueOnce(new Error(`failed https://api.mrscraper.com/?token=${FAKE_TOKEN}`));
    const invalid = await mrscraperAuth.validate({ auth: FAKE_TOKEN, server: { apiUrl: '', publicUrl: '' } });
    expect(invalid).toEqual({ valid: false, error: 'The API token could not be validated. Check the token and try again.' });
    expect(JSON.stringify(invalid)).not.toContain(FAKE_TOKEN);
  });

  it('reports truncated non-2xx details and redacts tokens', async () => {
    const longBody = `https://api.mrscraper.com/?token=${FAKE_TOKEN} ${'x'.repeat(1_200)}`;
    sendRequest.mockRejectedValue(new HttpError(undefined, { status: 429, responseBody: longBody }));
    const { error } = await tryCatch(() => mrscraperApi.request({ token: FAKE_TOKEN, origin: 'rendered', method: HttpMethod.POST, path: '/' }));
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).toContain('status 429');
      expect(error.message).toContain('[REDACTED]');
      expect(error.message).not.toContain(FAKE_TOKEN);
      expect(error.message.length).toBeLessThan(1_100);
    }
  });
});
