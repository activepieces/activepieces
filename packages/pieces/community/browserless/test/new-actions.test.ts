import { afterEach, describe, expect, test, vi } from 'vitest';
import { cancelCrawl } from '../src/lib/actions/cancel-crawl';
import { getCrawl } from '../src/lib/actions/get-crawl';
import { getPageContent } from '../src/lib/actions/get-page-content';
import { listCrawls } from '../src/lib/actions/list-crawls';
import { mapWebsite } from '../src/lib/actions/map-website';
import { runFunction } from '../src/lib/actions/run-function';
import { searchWeb } from '../src/lib/actions/search-web';
import { smartScrape } from '../src/lib/actions/smart-scrape';
import { startCrawl } from '../src/lib/actions/start-crawl';
import { unblockPage } from '../src/lib/actions/unblock-page';
import { browserlessOutputSchemas } from '../src/lib/output-schemas';
import { missingSchemaPaths, replies, runAction, stubFetch } from './helpers';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('get_page_content', () => {
    test('posts to /content and returns html with the site status', async () => {
        const seen = stubFetch(replies([{ text: '<html><h1>Example</h1></html>', headers: { 'x-response-code': '200', 'x-response-status': 'OK', 'x-response-url': 'https://example.com/' } }]));
        const { output } = await runAction({
            action: getPageContent,
            propsValue: { url: ' https://example.com ', waitUntil: 'networkidle2', navigationTimeout: 15000, waitForSelector: 'h1', waitForTimeout: 0, rejectResourceTypes: ['image', 'font'], bestAttempt: true, blockAds: true, timeout: 45000 },
        });
        expect(seen[0].path).toBe('/content');
        expect(seen[0].query.get('blockAds')).toBe('true');
        expect(seen[0].query.get('timeout')).toBe('45000');
        expect(seen[0].body).toEqual({
            url: 'https://example.com',
            gotoOptions: { waitUntil: 'networkidle2', timeout: 15000 },
            waitForSelector: { selector: 'h1' },
            waitForTimeout: 0,
            bestAttempt: true,
            rejectResourceTypes: ['image', 'font'],
        });
        expect(output).toEqual({ url: 'https://example.com', site_status_code: 200, site_status_text: 'OK', final_url: 'https://example.com/', html: '<html><h1>Example</h1></html>', html_length: 29, truncated: false });
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.getPageContent.fields })).toEqual([]);
    });
    test('caps HTML at Maximum Characters and reports the full length; 0 means no limit', async () => {
        const page = `<html>${'x'.repeat(150_000)}</html>`;
        stubFetch(replies([{ text: page }]));
        const capped = await runAction({ action: getPageContent, propsValue: { url: 'https://example.com' } });
        expect(capped.output).toMatchObject({ html_length: page.length, truncated: true });
        expect(String(Reflect.get(Object(capped.output), 'html')).length).toBe(100_000);
        const small = await runAction({ action: getPageContent, propsValue: { url: 'https://example.com', maxCharacters: 10 } });
        expect(small.output).toMatchObject({ html: '<html>xxxx', truncated: true });
        const full = await runAction({ action: getPageContent, propsValue: { url: 'https://example.com', maxCharacters: 0 } });
        expect(full.output).toMatchObject({ html: page, truncated: false });
    });
    test('rejects a non-http URL and a timeout above the step limit', async () => {
        const seen = stubFetch(replies([{ text: '' }]));
        await expect(runAction({ action: getPageContent, propsValue: { url: 'example.com' } })).rejects.toThrow(/http:\/\/ or https:\/\//);
        await expect(runAction({ action: getPageContent, propsValue: { url: 'https://example.com', timeout: 900000 } })).rejects.toThrow(/at most 540000/);
        expect(seen).toHaveLength(0);
    });
});

describe('smart_scrape', () => {
    const okResponse = {
        ok: true,
        statusCode: 200,
        content: '<html><h1>Title</h1></html>',
        contentType: 'text/html; charset=utf-8',
        headers: { 'content-type': 'text/html' },
        strategy: 'http-fetch',
        attempted: ['http-fetch'],
        message: null,
        actions: null,
        screenshot: Buffer.from('png-bytes').toString('base64'),
        pdf: null,
        markdown: '# Title',
        rawText: 'Title',
        links: ['https://example.com/a'],
        metadata: { title: 'Page Title', description: 'Desc', language: 'en', sourceURL: 'https://example.com', statusCode: 200 },
    };
    test('flattens the result and stores the screenshot as a file', async () => {
        const seen = stubFetch(replies([{ body: okResponse }]));
        const { output, written } = await runAction({
            action: smartScrape,
            propsValue: { url: 'https://example.com', formats: ['markdown', 'html', 'links', 'screenshot'], onlyMainContent: true, excludeTags: ['.ads'], waitFor: 1000, proxy: 'datacenter' },
        });
        expect(seen[0].path).toBe('/smart-scrape');
        expect(seen[0].body).toEqual({ url: 'https://example.com', formats: ['markdown', 'html', 'links', 'screenshot'], onlyMainContent: true, excludeTags: ['.ads'], waitFor: 1000, proxy: 'datacenter' });
        expect(written[0]).toMatchObject({ fileName: 'smart-scrape.png' });
        expect(written[0].data.toString()).toBe('png-bytes');
        expect(output).toMatchObject({ truncated: false, markdown: '# Title', html: '<html><h1>Title</h1></html>', title: 'Page Title', strategy: 'http-fetch', links_count: 1, screenshot_file: 'https://files.example/smart-scrape.png', pdf_file: null, content: null });
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.smartScrape.fields })).toEqual([]);
    });
    test('defaults to markdown and fails on ok:false (HTTP 200)', async () => {
        const seen = stubFetch(replies([{ body: { ok: false, statusCode: null, message: 'All strategies failed: blocked', attempted: ['http-fetch', 'browser'] } }]));
        await expect(runAction({ action: smartScrape, propsValue: { url: 'https://blocked.example' } })).rejects.toThrow(/Smart Scrape failed for https:\/\/blocked.example: All strategies failed: blocked/);
        expect(seen[0].body).toEqual({ url: 'https://blocked.example', formats: ['markdown'] });
    });
    test('markdown is capped at Maximum Characters', async () => {
        stubFetch(replies([{ body: { ...okResponse, markdown: 'm'.repeat(50), screenshot: null } }]));
        const { output } = await runAction({ action: smartScrape, propsValue: { url: 'https://example.com', maxCharacters: 20 } });
        expect(output).toMatchObject({ markdown: 'm'.repeat(20), truncated: true });
    });
    test('include and exclude selectors cannot be combined', async () => {
        stubFetch(replies([{ body: okResponse }]));
        await expect(runAction({ action: smartScrape, propsValue: { url: 'https://example.com', includeTags: ['main'], excludeTags: ['nav'] } })).rejects.toThrow(/cannot be combined/);
    });
    test('non-HTML targets return content instead of html', async () => {
        stubFetch(replies([{ body: { ...okResponse, contentType: 'application/json', content: { a: 1 }, screenshot: null } }]));
        const { output } = await runAction({ action: smartScrape, propsValue: { url: 'https://api.example.com/x.json', formats: ['html'] } });
        expect(output).toMatchObject({ html: null, content: { a: 1 } });
    });
    test('JSON content longer than Maximum Characters is cut to JSON text and flagged', async () => {
        const content = { text: 'x'.repeat(200) };
        stubFetch(replies([{ body: { ...okResponse, contentType: 'application/json', content, screenshot: null } }]));
        const { output } = await runAction({ action: smartScrape, propsValue: { url: 'https://api.example.com/x.json', maxCharacters: 50 } });
        expect(output).toMatchObject({ content: JSON.stringify(content).slice(0, 50), truncated: true });
    });
    test('JSON content within the limit, or with no limit, stays parsed', async () => {
        const content = { text: 'x'.repeat(200) };
        stubFetch(replies([{ body: { ...okResponse, contentType: 'application/json', content, screenshot: null } }]));
        const { output } = await runAction({ action: smartScrape, propsValue: { url: 'https://api.example.com/x.json', maxCharacters: 0 } });
        expect(output).toMatchObject({ content, truncated: false });
    });
    test('agents that leave Maximum Characters empty still get the 100000 cap on JSON', async () => {
        const content = ['y'.repeat(150_000)];
        stubFetch(replies([{ body: { ...okResponse, contentType: 'application/json', content, screenshot: null } }]));
        const { output } = await runAction({ action: smartScrape, propsValue: { url: 'https://api.example.com/x.json' } });
        expect(output).toMatchObject({ content: JSON.stringify(content).slice(0, 100_000), truncated: true });
    });
});

describe('search_web', () => {
    const response = {
        success: true,
        data: {
            web: [{ title: 'Browserless', url: 'https://www.browserless.io', description: 'Headless', position: 1, markdown: '# B', metadata: { statusCode: 200, strategy: 'http-fetch' } }],
            news: [{ title: 'News', url: 'https://news.example/1', description: 'n', position: 1, date: '2026-10-01', imageUrl: 'https://img.example/1.jpg' }],
            images: [{ title: 'Logo', imageUrl: 'https://img.example/logo.png', imageWidth: 100, imageHeight: 50, url: 'https://www.browserless.io', position: 1 }],
        },
        totalResults: 3,
    };
    test('sends the query and flattens all sources', async () => {
        const seen = stubFetch(replies([{ body: response }]));
        const { output } = await runAction({
            action: searchWeb,
            propsValue: { query: ' headless browser ', sources: ['web', 'news', 'images'], limit: 5, tbs: 'week', lang: 'EN', country: 'US', scrapeFormats: ['markdown'], onlyMainContent: true, proxy: 'datacenter' },
        });
        expect(seen[0].path).toBe('/search');
        expect(seen[0].body).toEqual({
            query: 'headless browser',
            limit: 5,
            sources: ['web', 'news', 'images'],
            tbs: 'week',
            lang: 'en',
            country: 'us',
            proxy: 'datacenter',
            scrapeOptions: { formats: ['markdown'], onlyMainContent: true },
        });
        expect(output).toMatchObject({ total_results: 3, result_count: 3, no_results: false });
        expect(output).toMatchObject({ results: [{ source: 'web', markdown: '# B', page_status_code: 200 }, { source: 'news', date: '2026-10-01' }, { source: 'images', image_url: 'https://img.example/logo.png' }] });
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.searchWeb.fields })).toEqual([]);
    });
    test('no_results is an empty list, other errors fail', async () => {
        stubFetch(replies([{ body: { success: false, data: {}, totalResults: 0, errorCode: 'no_results' } }, { body: { success: false, error: 'Search engines did not answer', errorCode: 'upstream_timeout' } }]));
        const empty = await runAction({ action: searchWeb, propsValue: { query: 'zzzz' } });
        expect(empty.output).toMatchObject({ result_count: 0, no_results: true, results: [] });
        await expect(runAction({ action: searchWeb, propsValue: { query: 'x' } })).rejects.toThrow(/Search engines did not answer/);
    });
});

describe('map_website', () => {
    test('accepts the documented {success, links} shape', async () => {
        const seen = stubFetch(replies([{ body: { success: true, links: [{ url: 'https://example.com/a', title: 'A' }, { url: 'https://example.com/b' }] } }]));
        const { output } = await runAction({ action: mapWebsite, propsValue: { url: 'https://example.com', search: 'pricing', limit: 50, sitemap: 'include', includeSubdomains: false, ignoreQueryParameters: true, proxy: 'datacenter' } });
        expect(seen[0].body).toEqual({ url: 'https://example.com', search: 'pricing', limit: 50, sitemap: 'include', includeSubdomains: false, ignoreQueryParameters: true, proxy: 'datacenter' });
        expect(output).toEqual({ url: 'https://example.com', count: 2, links: [{ url: 'https://example.com/a', title: 'A', description: null }, { url: 'https://example.com/b', title: null, description: null }] });
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.mapWebsite.fields })).toEqual([]);
    });
    test('accepts the OpenAPI array-of-strings shape and fails on success:false', async () => {
        const seen = stubFetch(replies([{ body: ['https://example.com/a'] }, { body: { success: false, error: 'Invalid URL' } }]));
        const { output } = await runAction({ action: mapWebsite, propsValue: { url: 'https://example.com' } });
        expect(output).toMatchObject({ count: 1, links: [{ url: 'https://example.com/a' }] });
        expect(seen[0].body).toEqual({ url: 'https://example.com', limit: 500, includeSubdomains: true, ignoreQueryParameters: true });
        await expect(runAction({ action: mapWebsite, propsValue: { url: 'https://example.com' } })).rejects.toThrow(/Invalid URL/);
    });
});

describe('crawl actions', () => {
    test('start_crawl posts options and returns the ID', async () => {
        const seen = stubFetch(replies([{ body: { success: true, id: 'crawl_abc123', url: 'https://production-sfo.browserless.io/crawl/crawl_abc123' } }]));
        const { output } = await runAction({
            action: startCrawl,
            propsValue: { url: 'https://example.com/docs', limit: 10, maxDepth: 2, includePaths: ['^/docs/'], excludePaths: [], formats: ['markdown'], onlyMainContent: true, proxy: 'datacenter', sitemap: 'auto' },
        });
        expect(seen[0].path).toBe('/crawl');
        expect(seen[0].body).toEqual({
            url: 'https://example.com/docs',
            limit: 10,
            maxDepth: 2,
            includePaths: ['^/docs/'],
            sitemap: 'auto',
            scrapeOptions: { formats: ['markdown'], onlyMainContent: true, proxy: 'datacenter' },
        });
        expect(output).toEqual({ crawl_id: 'crawl_abc123', url: 'https://example.com/docs', status: 'in-progress' });
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.startCrawl.fields })).toEqual([]);
    });
    test('start_crawl applies the 10-page cap and main-content default when an agent leaves them empty', async () => {
        const seen = stubFetch(replies([{ body: { success: true, id: 'crawl_abc123' } }]));
        await runAction({ action: startCrawl, propsValue: { url: 'https://example.com' } });
        expect(seen[0].body).toEqual({ url: 'https://example.com', limit: 10, scrapeOptions: { onlyMainContent: true } });
    });
    test('get_crawl reads a batch and the next skip', async () => {
        const seen = stubFetch(
            replies([
                {
                    body: {
                        status: 'completed',
                        total: 15,
                        completed: 15,
                        failed: 0,
                        expiresAt: '2025-07-01T12:00:00.000Z',
                        next: 'https://production-sfo.browserless.io/crawl/crawl_abc123?skip=10',
                        data: [
                            {
                                status: 'completed',
                                contentUrl: 'https://crawl-artifacts.s3.amazonaws.com/page.json?X-Amz-Signature=x',
                                metadata: { title: 'Home', description: 'd', language: 'en', scrapedAt: '2025-06-30T10:00:00.000Z', sourceURL: 'https://example.com', statusCode: 200, error: null },
                            },
                        ],
                    },
                },
            ]),
        );
        const { output } = await runAction({ action: getCrawl, propsValue: { crawlId: ' crawl_abc123 ', skip: 0 } });
        expect(seen[0].method).toBe('GET');
        expect(seen[0].path).toBe('/crawl/crawl_abc123');
        expect(seen[0].query.get('skip')).toBe('0');
        expect(output).toMatchObject({ status: 'completed', total: 15, has_more: true, next_skip: 10, page_count: 1, pages: [{ url: 'https://example.com', title: 'Home', status_code: 200 }] });
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.getCrawl.fields })).toEqual([]);
    });
    test('crawl IDs are validated before use in the path', async () => {
        const seen = stubFetch(replies([{ body: {} }]));
        await expect(runAction({ action: getCrawl, propsValue: { crawlId: '../session' } })).rejects.toThrow(/Crawl ID must look like/);
        await expect(runAction({ action: cancelCrawl, propsValue: { crawlId: 'a/b' } })).rejects.toThrow(/Crawl ID must look like/);
        expect(seen).toHaveLength(0);
    });
    test('list_crawls passes filters and the cursor', async () => {
        const seen = stubFetch(replies([{ body: { crawls: [{ id: 'crawl_1', url: 'https://example.com', status: 'completed', total: 15, completed: 15, createdAt: '2025-06-30T09:00:00.000Z', completedAt: '2025-06-30T09:05:00.000Z' }], nextCursor: 'eyJza2lwIjoxMH0' } }]));
        const { output } = await runAction({ action: listCrawls, propsValue: { status: 'completed', limit: 10, cursor: 'abc' } });
        expect(seen[0].path).toBe('/crawl');
        expect(seen[0].query.get('status')).toBe('completed');
        expect(seen[0].query.get('limit')).toBe('10');
        expect(seen[0].query.get('cursor')).toBe('abc');
        expect(output).toMatchObject({ count: 1, has_more: true, next_cursor: 'eyJza2lwIjoxMH0', crawls: [{ id: 'crawl_1', created_at: '2025-06-30T09:00:00.000Z' }] });
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.listCrawls.fields })).toEqual([]);
    });
    test('cancel_crawl: DELETE, 409 reported as already finished, 404 fails', async () => {
        const seen = stubFetch(
            replies([
                { body: { status: 'cancelled' } },
                { status: 409, body: { id: 'crawl_abc123', status: 'completed', message: 'Crawl is already completed' } },
                { status: 404, body: { message: 'Crawl not found' } },
            ]),
        );
        const first = await runAction({ action: cancelCrawl, propsValue: { crawlId: 'crawl_abc123' } });
        expect(seen[0].method).toBe('DELETE');
        expect(seen[0].path).toBe('/crawl/crawl_abc123');
        expect(first.output).toEqual({ crawl_id: 'crawl_abc123', cancelled: true, status: 'cancelled', message: null });
        expect(missingSchemaPaths({ output: first.output, fields: browserlessOutputSchemas.cancelCrawl.fields })).toEqual([]);
        const second = await runAction({ action: cancelCrawl, propsValue: { crawlId: 'crawl_abc123' } });
        expect(second.output).toEqual({ crawl_id: 'crawl_abc123', cancelled: false, status: 'completed', message: 'Crawl is already completed' });
        await expect(runAction({ action: cancelCrawl, propsValue: { crawlId: 'crawl_abc123' } })).rejects.toThrow(/404/);
    });
});

describe('unblock_page', () => {
    test('sends toggles in the body and proxy/captcha options as query params', async () => {
        const seen = stubFetch(
            replies([
                {
                    body: {
                        content: '<html>ok</html>',
                        cookies: [{ name: 'cf_clearance', value: 'abc', domain: '.example.com', path: '/', expires: 1790000000, httpOnly: true, secure: true, sameSite: 'None' }],
                        browserWSEndpoint: null,
                        ttl: 0,
                        screenshot: Buffer.from('jpg').toString('base64'),
                        solved: true,
                    },
                },
            ]),
        );
        const { output, written } = await runAction({
            action: unblockPage,
            propsValue: { url: 'https://example.com', returnContent: true, returnCookies: true, returnScreenshot: true, solveCaptchas: true, proxy: 'residential', proxyCountry: 'US', timeout: 120000 },
        });
        expect(seen[0].path).toBe('/unblock');
        expect(seen[0].query.get('proxy')).toBe('residential');
        expect(seen[0].query.get('proxyCountry')).toBe('us');
        expect(seen[0].query.get('solveCaptchas')).toBe('true');
        expect(seen[0].query.get('timeout')).toBe('120000');
        expect(seen[0].body).toEqual({ url: 'https://example.com', content: true, cookies: true, screenshot: true, browserWSEndpoint: false });
        expect(written[0].fileName).toBe('unblocked.jpg');
        expect(output).toMatchObject({ truncated: false, solved: true, html_length: 15, cookie_count: 1, cookie_header: 'cf_clearance=abc', screenshot_file: 'https://files.example/unblocked.jpg', cookies: [{ name: 'cf_clearance', http_only: true, same_site: 'None' }] });
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.unblockPage.fields })).toEqual([]);
    });
});

describe('run_function', () => {
    test('JSON result is parsed', async () => {
        const seen = stubFetch(replies([{ body: { title: 'Example Domain' } }]));
        const { output } = await runAction({ action: runFunction, propsValue: { code: 'export default async () => ({ data: 1 })', context: { url: 'https://example.com' }, timeout: 30000 } });
        expect(seen[0].path).toBe('/function');
        expect(seen[0].query.get('timeout')).toBe('30000');
        expect(seen[0].body).toEqual({ code: 'export default async () => ({ data: 1 })', context: { url: 'https://example.com' } });
        expect(output).toEqual({ content_type: 'application/json', result: { title: 'Example Domain' }, file: null, size_bytes: 26 });
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.runFunction.fields })).toEqual([]);
    });
    test('live envelope { data, type } is unwrapped; binary data becomes a file', async () => {
        stubFetch(replies([{ body: { data: { title: 'Example Domain' }, type: 'application/json' } }, { body: { data: { 0: 37, 1: 80, 2: 68, 3: 70 }, type: 'application/pdf' } }]));
        const json = await runAction({ action: runFunction, propsValue: { code: 'x' } });
        expect(json.output).toMatchObject({ content_type: 'application/json', result: { title: 'Example Domain' }, file: null });
        const pdf = await runAction({ action: runFunction, propsValue: { code: 'x' } });
        expect(pdf.written[0].fileName).toBe('function-result.pdf');
        expect(pdf.written[0].data.toString()).toBe('%PDF');
        expect(pdf.output).toEqual({ content_type: 'application/pdf', result: null, file: 'https://files.example/function-result.pdf', size_bytes: 4 });
    });
    test('binary result is stored as a file', async () => {
        stubFetch(replies([{ binary: Buffer.from('%PDF-1.7'), headers: { 'content-type': 'application/pdf' } }]));
        const { output, written } = await runAction({ action: runFunction, propsValue: { code: 'x' } });
        expect(written[0].fileName).toBe('function-result.pdf');
        expect(output).toEqual({ content_type: 'application/pdf', result: null, file: 'https://files.example/function-result.pdf', size_bytes: 8 });
    });
    test('empty code is refused', async () => {
        await expect(runAction({ action: runFunction, propsValue: { code: '  ' } })).rejects.toThrow(/Enter the code/);
    });
});
