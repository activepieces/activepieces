import { afterEach, describe, expect, test, vi } from 'vitest';
import { batchScreenshots } from '../src/lib/actions/batch-screenshots';
import { checkCache } from '../src/lib/actions/check-cache';
import { createPdf } from '../src/lib/actions/create-pdf';
import { extractContent } from '../src/lib/actions/extract-content';
import { getBatchStatus } from '../src/lib/actions/get-batch-status';
import { getUsage } from '../src/lib/actions/get-usage';
import { renderHtml } from '../src/lib/actions/render-html';
import { signScreenshotUrl } from '../src/lib/actions/sign-screenshot-url';
import { takeScreenshot } from '../src/lib/actions/take-screenshot';
import { snaprenderOutputSchemas } from '../src/lib/output-schemas';
import { API_KEY, PNG, actionContext, apiError, missingSchemaPaths, replies, runAction, stubFetch } from './helpers';

const CAPTURE_HEADERS = { 'content-type': 'image/png', 'x-cache': 'MISS', 'x-remaining-credits': '199', 'x-response-time': '1834ms', 'x-request-id': 'req-1' };
const JOB_ID = '550e8400-e29b-41d4-a716-446655440000';

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('take_screenshot', () => {
    test('defaults: POST /v1/screenshot with ads and cookie banners blocked, file stored', async () => {
        const seen = stubFetch(replies([{ binary: PNG, headers: CAPTURE_HEADERS }]));
        const { output, written } = await runAction({ action: takeScreenshot, propsValue: { url: 'https://example.com', format: 'png' } });
        expect(seen[0].method).toBe('POST');
        expect(seen[0].url).toBe('https://app.snap-render.com/v1/screenshot');
        expect(seen[0].headers.get('x-api-key')).toBe(API_KEY);
        expect(seen[0].body).toEqual({ url: 'https://example.com', format: 'png', full_page: false, dark_mode: false, block_ads: true, block_cookie_banners: true });
        expect(written).toHaveLength(1);
        expect(written[0].fileName).toBe('screenshot.png');
        expect(written[0].data.equals(PNG)).toBe(true);
        expect(output).toEqual({
            file: 'https://files.example/screenshot.png',
            file_name: 'screenshot.png',
            format: 'png',
            content_type: 'image/png',
            size_bytes: PNG.length,
            source: 'url',
            page_url: 'https://example.com',
            served_from_cache: false,
            captures_remaining: 199,
            render_time_ms: 1834,
            request_id: 'req-1',
        });
        expect(missingSchemaPaths({ output, fields: snaprenderOutputSchemas.capture.fields })).toEqual([]);
    });
    test('every option maps to the API field', async () => {
        const seen = stubFetch(replies([{ binary: PNG, headers: { 'x-cache': 'HIT', 'content-type': 'image/jpeg' } }]));
        const { output, written } = await runAction({
            action: takeScreenshot,
            propsValue: {
                url: ' example.com/pricing ',
                format: 'jpeg',
                fullPage: true,
                device: 'iphone_15_pro',
                darkMode: true,
                blockAds: false,
                blockCookieBanners: false,
                width: 1440,
                height: 900,
                delay: 1500,
                quality: 70,
                hideSelectors: ' .chat, #promo ',
                clickSelector: 'button.accept',
                userAgent: 'MyBot/1.0',
                useCache: true,
                cacheTtl: 3600,
                embedDetails: false,
                fileName: 'Pricing page.png',
            },
        });
        expect(seen[0].body).toEqual({
            url: 'https://example.com/pricing',
            format: 'jpeg',
            full_page: true,
            dark_mode: true,
            block_ads: false,
            block_cookie_banners: false,
            device: 'iphone_15_pro',
            width: 1440,
            height: 900,
            delay: 1500,
            quality: 70,
            hide_selectors: '.chat, #promo',
            click_selector: 'button.accept',
            user_agent: 'MyBot/1.0',
            cache: true,
            cache_ttl: 3600,
            metadata: false,
        });
        expect(written[0].fileName).toBe('Pricing-page.jpg');
        expect(output).toMatchObject({ served_from_cache: true, captures_remaining: null, content_type: 'image/jpeg' });
    });
    test('desktop device and PNG quality are not sent', async () => {
        const seen = stubFetch(replies([{ binary: PNG }]));
        await runAction({ action: takeScreenshot, propsValue: { url: 'https://example.com', format: 'png', device: 'desktop', quality: 50, cacheTtl: 60 } });
        expect(seen[0].body).not.toHaveProperty('device');
        expect(seen[0].body).not.toHaveProperty('quality');
        expect(seen[0].body).not.toHaveProperty('cache');
        expect(seen[0].body).not.toHaveProperty('cache_ttl');
    });
    test.each([
        [{ width: 100 }, /Width must be between 320 and 3840/],
        [{ height: 20000 }, /Height must be between 200 and 10000/],
        [{ delay: -1 }, /Delay must be between 0 and 10000/],
        [{ delay: 1.5 }, /Delay must be a whole number/],
        [{ format: 'gif' }, /Format must be one of: png, jpeg, webp/],
        [{ url: '  ' }, /Page URL is required/],
    ])('invalid input %o fails before any request', async (override, message) => {
        const seen = stubFetch(replies([{ binary: PNG }]));
        await expect(runAction({ action: takeScreenshot, propsValue: { url: 'https://example.com', format: 'png', ...override } })).rejects.toThrow(message);
        expect(seen).toHaveLength(0);
    });
    test('a target-site failure shows the API code and message and stores nothing', async () => {
        stubFetch(replies([apiError({ status: 422, code: 'TARGET_UNREACHABLE', message: 'The target website could not be reached.' })]));
        const { context, written } = actionContext({ propsValue: { url: 'https://nope.invalid', format: 'png' } });
        await expect(takeScreenshot.run(context)).rejects.toThrow('TARGET_UNREACHABLE: The target website could not be reached.');
        expect(written).toEqual([]);
    });
});

describe('file names', () => {
    test.each([
        [{ format: 'png', fileName: 'report.v2' }, 'report.v2.png'],
        [{ format: 'jpeg', fileName: 'Shot.JPEG' }, 'Shot.jpg'],
        [{ format: 'webp', fileName: '***' }, 'screenshot.webp'],
        [{ format: 'png', fileName: '  ' }, 'screenshot.png'],
        [{ format: 'png', fileName: 'a/b\\c d' }, 'a-b-c-d.png'],
    ])('%o is saved as %s', async (props, expected) => {
        stubFetch(replies([{ binary: PNG }]));
        const { written } = await runAction({ action: takeScreenshot, propsValue: { url: 'https://example.com', ...props } });
        expect(written[0].fileName).toBe(expected);
    });
});

describe('create_pdf', () => {
    test('sends format pdf with full page on by default', async () => {
        const seen = stubFetch(replies([{ binary: Buffer.from('%PDF-1.7'), headers: { 'content-type': 'application/pdf' } }]));
        const { output, written } = await runAction({ action: createPdf, propsValue: { url: 'https://example.com/invoice', fullPage: true, quality: 80 } });
        expect(seen[0].body).toEqual({ url: 'https://example.com/invoice', format: 'pdf', full_page: true, dark_mode: false, block_ads: true, block_cookie_banners: true, quality: 80 });
        expect(written[0].fileName).toBe('page.pdf');
        expect(output).toMatchObject({ format: 'pdf', content_type: 'application/pdf', file_name: 'page.pdf' });
        expect(missingSchemaPaths({ output, fields: snaprenderOutputSchemas.capture.fields })).toEqual([]);
    });
    test('the full page default comes from the prop', () => {
        expect(createPdf.props.fullPage.defaultValue).toBe(true);
        expect(takeScreenshot.props.fullPage.defaultValue).toBe(false);
    });
});

describe('render_html', () => {
    test('sends html without the ad and banner blockers', async () => {
        const seen = stubFetch(replies([{ binary: PNG }]));
        const { output } = await runAction({ action: renderHtml, propsValue: { contentType: 'html', content: '<h1>Hello</h1>', format: 'png', width: 1200, height: 630, fullPage: false } });
        expect(seen[0].body).toEqual({ html: '<h1>Hello</h1>', format: 'png', full_page: false, dark_mode: false, block_ads: false, block_cookie_banners: false, width: 1200, height: 630 });
        expect(output).toMatchObject({ source: 'html', page_url: null });
    });
    test('sends markdown and supports PDF', async () => {
        const seen = stubFetch(replies([{ binary: Buffer.from('%PDF') }]));
        const { written } = await runAction({ action: renderHtml, propsValue: { contentType: 'markdown', content: '# Report', format: 'pdf', fullPage: true, fileName: 'weekly report' } });
        expect(seen[0].body).toMatchObject({ markdown: '# Report', format: 'pdf', full_page: true });
        expect(seen[0].body).not.toHaveProperty('html');
        expect(written[0].fileName).toBe('weekly-report.pdf');
    });
    test('empty content fails before any request', async () => {
        const seen = stubFetch(replies([{ binary: PNG }]));
        await expect(runAction({ action: renderHtml, propsValue: { contentType: 'html', content: ' ', format: 'png' } })).rejects.toThrow(/Content is required/);
        expect(seen).toHaveLength(0);
    });
});

describe('extract_content', () => {
    test('markdown: POST /v1/extract and a flat output', async () => {
        const seen = stubFetch(replies([{ body: { url: 'https://example.com', type: 'markdown', content: '# Example Domain', wordCount: 3, processingTimeMs: 950 } }]));
        const { output } = await runAction({ action: extractContent, propsValue: { url: 'https://example.com', type: 'markdown', selector: ' main ', maxLength: 5000, delay: 200 } });
        expect(seen[0].url).toBe('https://app.snap-render.com/v1/extract');
        expect(seen[0].body).toEqual({ url: 'https://example.com', type: 'markdown', block_ads: true, block_cookie_banners: true, selector: 'main', max_length: 5000, delay: 200 });
        expect(output).toMatchObject({ url: 'https://example.com', type: 'markdown', content: '# Example Domain', word_count: 3, processing_time_ms: 950, links: [], link_count: 0, title: null });
        expect(missingSchemaPaths({ output, fields: snaprenderOutputSchemas.extract.fields })).toEqual([]);
    });
    test('article fields are lifted to the top level', async () => {
        stubFetch(replies([{ body: { url: 'https://blog.example/post', type: 'article', content: { title: 'Post', author: 'Ann', excerpt: 'Short', content: 'Body text', wordCount: 2 }, wordCount: 2, processingTimeMs: 10 } }]));
        const { output } = await runAction({ action: extractContent, propsValue: { url: 'https://blog.example/post', type: 'article' } });
        expect(output).toMatchObject({ content: 'Body text', title: 'Post', author: 'Ann', excerpt: 'Short', word_count: 2 });
    });
    test('links become rows with url and text', async () => {
        stubFetch(replies([{ body: { url: 'https://example.com', type: 'links', content: [{ href: 'https://iana.org', text: 'More information' }, { href: 'https://example.com/a', text: '' }] } }]));
        const { output } = await runAction({ action: extractContent, propsValue: { url: 'https://example.com', type: 'links' } });
        expect(output).toMatchObject({ content: null, link_count: 2, links: [{ url: 'https://iana.org', text: 'More information' }, { url: 'https://example.com/a', text: '' }] });
        expect(missingSchemaPaths({ output, fields: snaprenderOutputSchemas.extract.fields })).toEqual([]);
    });
    test('metadata becomes flat snake_case fields', async () => {
        stubFetch(replies([{ body: { url: 'https://example.com', type: 'metadata', content: { title: 'Example', description: 'Desc', canonical: 'https://example.com/', ogTitle: 'OG', ogDescription: null, ogImage: 'https://example.com/og.png', ogUrl: null, ogType: 'website', twitterCard: 'summary', twitterTitle: null, twitterDescription: null, twitterImage: null } } }]));
        const { output } = await runAction({ action: extractContent, propsValue: { url: 'https://example.com', type: 'metadata', useCache: true } });
        expect(output).toMatchObject({ title: 'Example', description: 'Desc', canonical_url: 'https://example.com/', og_title: 'OG', og_image: 'https://example.com/og.png', og_type: 'website', twitter_card: 'summary', og_description: null, content: null });
    });
    test('cache option and max length validation', async () => {
        const seen = stubFetch(replies([{ body: { url: 'https://example.com', type: 'text', content: 'x' } }]));
        await runAction({ action: extractContent, propsValue: { url: 'https://example.com', type: 'text', useCache: true, cacheTtl: 600 } });
        expect(seen[0].body).toMatchObject({ cache: true, cache_ttl: 600 });
        await expect(runAction({ action: extractContent, propsValue: { url: 'https://example.com', type: 'text', maxLength: 0 } })).rejects.toThrow(/Maximum Length must be between 1 and 500000/);
    });
});

describe('batch_screenshots', () => {
    const created = { jobId: JOB_ID, status: 'pending', statusUrl: `/v1/screenshot/batch/${JOB_ID}`, total: 2, completed: 0, failed: 0, estimatedSeconds: 12, items: [{ url: 'https://a.com', status: 'pending' }, { url: 'https://b.com', status: 'pending' }], createdAt: '2026-11-09T10:00:00.000Z' };
    const done = { ...created, status: 'completed', completed: 1, failed: 1, completedAt: '2026-11-09T10:00:20.000Z', items: [{ url: 'https://a.com', status: 'completed', downloadUrl: 'https://r2.example/a.png' }, { url: 'https://b.com', status: 'failed', error: 'TARGET_UNREACHABLE' }] };

    test('without waiting: one POST, returns the job', async () => {
        const seen = stubFetch(replies([{ status: 202, body: created }]));
        const { output } = await runAction({ action: batchScreenshots, propsValue: { urls: ['https://a.com', ' b.com ', ''], format: 'webp', waitForResults: false, quality: 60, device: 'pixel_7' } });
        expect(seen).toHaveLength(1);
        expect(seen[0].url).toBe('https://app.snap-render.com/v1/screenshot/batch');
        expect(seen[0].body).toEqual({ urls: ['https://a.com', 'https://b.com'], format: 'webp', full_page: false, dark_mode: false, block_ads: true, block_cookie_banners: true, device: 'pixel_7', quality: 60 });
        expect(output).toMatchObject({ job_id: JOB_ID, status: 'pending', finished: false, total: 2, estimated_seconds: 12, download_urls: [], completed_at: null });
        expect(missingSchemaPaths({ output, fields: snaprenderOutputSchemas.batch.fields })).toEqual([]);
    });
    test('waiting: polls the job until it finishes', async () => {
        vi.useFakeTimers();
        const seen = stubFetch(replies([{ status: 202, body: created }, { body: { ...created, status: 'processing' } }, { body: done }]));
        const promise = runAction({ action: batchScreenshots, propsValue: { urls: ['https://a.com', 'https://b.com'], format: 'png' } });
        await vi.advanceTimersByTimeAsync(10_000);
        const { output } = await promise;
        expect(seen.map((request) => `${request.method} ${request.path}`)).toEqual(['POST /v1/screenshot/batch', `GET /v1/screenshot/batch/${JOB_ID}`, `GET /v1/screenshot/batch/${JOB_ID}`]);
        expect(output).toMatchObject({
            status: 'completed',
            finished: true,
            completed: 1,
            failed: 1,
            estimated_seconds: 12,
            download_urls: ['https://r2.example/a.png'],
            items: [
                { url: 'https://a.com', status: 'completed', download_url: 'https://r2.example/a.png', error: null },
                { url: 'https://b.com', status: 'failed', download_url: null, error: 'TARGET_UNREACHABLE' },
            ],
        });
        expect(missingSchemaPaths({ output, fields: snaprenderOutputSchemas.batch.fields })).toEqual([]);
    });
    test('waiting stops at the maximum wait and returns progress', async () => {
        vi.useFakeTimers();
        const seen = stubFetch(replies([{ status: 202, body: created }, { body: { ...created, status: 'processing' } }]));
        const promise = runAction({ action: batchScreenshots, propsValue: { urls: ['https://a.com'], format: 'png', maxWaitSeconds: 10 } });
        await vi.advanceTimersByTimeAsync(20_000);
        const { output } = await promise;
        expect(seen.length).toBeLessThanOrEqual(5);
        expect(output).toMatchObject({ status: 'processing', finished: false, job_id: JOB_ID });
    });
    test('a failed poll keeps waiting with the last known state', async () => {
        vi.useFakeTimers();
        const seen = stubFetch(replies([{ status: 202, body: created }, apiError({ status: 502, code: 'HTTP_502', message: 'bad gateway' }), { body: done }]));
        const promise = runAction({ action: batchScreenshots, propsValue: { urls: ['https://a.com', 'https://b.com'], format: 'png' } });
        await vi.advanceTimersByTimeAsync(10_000);
        const { output } = await promise;
        expect(seen).toHaveLength(3);
        expect(output).toMatchObject({ status: 'completed', finished: true, job_id: JOB_ID });
    });
    test('if every poll fails, the step still returns the Job ID', async () => {
        vi.useFakeTimers();
        stubFetch(replies([{ status: 202, body: created }, { throws: new Error('socket hang up') }]));
        const promise = runAction({ action: batchScreenshots, propsValue: { urls: ['https://a.com'], format: 'png', maxWaitSeconds: 10 } });
        await vi.advanceTimersByTimeAsync(20_000);
        const { output } = await promise;
        expect(output).toMatchObject({ job_id: JOB_ID, status: 'pending', finished: false });
    });
    test.each([
        [{ urls: [] }, /at least one page URL/],
        [{ urls: Array.from({ length: 51 }, (_, i) => `https://e${i}.com`) }, /at most 50 URLs; this one has 51/],
        [{ urls: ['https://a.com'], maxWaitSeconds: 5 }, /Maximum Wait must be between 10 and 300/],
        [{ urls: ['https://a.com'], maxWaitSeconds: 301 }, /Maximum Wait must be between 10 and 300/],
    ])('invalid input fails before any request', async (override, message) => {
        const seen = stubFetch(replies([{ body: created }]));
        await expect(runAction({ action: batchScreenshots, propsValue: { format: 'png', ...override } })).rejects.toThrow(message);
        expect(seen).toHaveLength(0);
    });
    test('quota errors show the API message', async () => {
        stubFetch(replies([apiError({ status: 429, code: 'QUOTA_EXCEEDED', message: 'This batch needs 50 captures but 10 are left this month.' })]));
        await expect(runAction({ action: batchScreenshots, propsValue: { urls: ['https://a.com'], format: 'png' } })).rejects.toThrow('QUOTA_EXCEEDED: This batch needs 50 captures but 10 are left this month.');
    });
});

describe('get_batch_status', () => {
    test('GET /v1/screenshot/batch/:id', async () => {
        const seen = stubFetch(replies([{ body: { jobId: JOB_ID, status: 'completed', total: 1, completed: 1, failed: 0, items: [{ url: 'https://a.com', status: 'completed', downloadUrl: 'https://r2.example/a.png' }], createdAt: '2026-11-09T10:00:00.000Z', completedAt: '2026-11-09T10:00:05.000Z' } }]));
        const { output } = await runAction({ action: getBatchStatus, propsValue: { jobId: ` ${JOB_ID} ` } });
        expect(seen[0].url).toBe(`https://app.snap-render.com/v1/screenshot/batch/${JOB_ID}`);
        expect(output).toMatchObject({ finished: true, download_urls: ['https://r2.example/a.png'], estimated_seconds: null });
        expect(missingSchemaPaths({ output, fields: snaprenderOutputSchemas.batch.fields })).toEqual([]);
    });
    test('an expired job shows NOT_FOUND', async () => {
        stubFetch(replies([apiError({ status: 404, code: 'NOT_FOUND', message: 'Batch job not found or expired' })]));
        await expect(runAction({ action: getBatchStatus, propsValue: { jobId: JOB_ID } })).rejects.toThrow('NOT_FOUND: Batch job not found or expired');
    });
    test('a malformed job id is refused before any request', async () => {
        const seen = stubFetch(replies([{ body: {} }]));
        await expect(runAction({ action: getBatchStatus, propsValue: { jobId: '../usage' } })).rejects.toThrow(/Job ID must be/);
        expect(seen).toHaveLength(0);
    });
});

describe('sign_screenshot_url', () => {
    test('POST /v1/screenshot/sign with render options', async () => {
        const seen = stubFetch(replies([{ body: { signed_url: 'https://app.snap-render.com/v1/screenshot/render?url=x&sig=y', expires_at: '2026-11-10T10:00:00.000Z', expires_in: 86400 } }]));
        const { output } = await runAction({ action: signScreenshotUrl, propsValue: { url: 'https://example.com', format: 'png', expiresIn: 86400, fullPage: true } });
        expect(seen[0].url).toBe('https://app.snap-render.com/v1/screenshot/sign');
        expect(seen[0].body).toEqual({ url: 'https://example.com', format: 'png', expires_in: 86400, full_page: true, dark_mode: false, block_ads: true, block_cookie_banners: true });
        expect(output).toEqual({ signed_url: 'https://app.snap-render.com/v1/screenshot/render?url=x&sig=y', expires_at: '2026-11-10T10:00:00.000Z', expires_in_seconds: 86400 });
        expect(missingSchemaPaths({ output, fields: snaprenderOutputSchemas.signedUrl.fields })).toEqual([]);
    });
    test('expiry outside 60 to 2592000 is refused', async () => {
        stubFetch(replies([{ body: {} }]));
        await expect(runAction({ action: signScreenshotUrl, propsValue: { url: 'https://example.com', format: 'png', expiresIn: 30 } })).rejects.toThrow(/Valid For must be between 60 and 2592000/);
    });
});

describe('check_cache', () => {
    test('sends the capture settings so the stored copy key matches', async () => {
        const seen = stubFetch(replies([{ body: { url: 'https://example.com', cached: false } }]));
        await runAction({ action: checkCache, propsValue: { url: 'https://example.com', format: 'pdf', fullPage: true, device: 'pixel_7', darkMode: true, quality: 80, hideSelectors: '.x', blockCookieBanners: false } });
        const query = Object.fromEntries(seen[0].query.entries());
        expect(query).toEqual({ url: 'https://example.com', format: 'pdf', full_page: 'true', dark_mode: 'true', block_ads: 'true', block_cookie_banners: 'false', device: 'pixel_7', quality: '80', hide_selectors: '.x' });
    });
    test('GET /v1/screenshot/info with an encoded URL', async () => {
        const seen = stubFetch(replies([{ body: { url: 'https://example.com/?q=a b', cached: true, cache_key: 'abc', cached_at: '2026-11-09T09:00:00.000Z', expires_at: '2026-11-10T09:00:00.000Z', content_type: 'image/jpeg' } }]));
        const { output } = await runAction({ action: checkCache, propsValue: { url: 'https://example.com/?q=a b', format: 'jpeg', width: 1280, height: 800 } });
        expect(seen[0].method).toBe('GET');
        expect(seen[0].path).toBe('/v1/screenshot/info');
        expect(seen[0].query.get('url')).toBe('https://example.com/?q=a b');
        expect(seen[0].query.get('format')).toBe('jpeg');
        expect(seen[0].query.get('width')).toBe('1280');
        expect(output).toEqual({ url: 'https://example.com/?q=a b', cached: true, cached_at: '2026-11-09T09:00:00.000Z', expires_at: '2026-11-10T09:00:00.000Z', content_type: 'image/jpeg' });
        expect(missingSchemaPaths({ output, fields: snaprenderOutputSchemas.cache.fields })).toEqual([]);
    });
    test('a miss returns nulls, not missing keys', async () => {
        stubFetch(replies([{ body: { url: 'https://example.com', cached: false, cache_key: 'abc' } }]));
        const { output } = await runAction({ action: checkCache, propsValue: { url: 'https://example.com', format: 'png' } });
        expect(output).toEqual({ url: 'https://example.com', cached: false, cached_at: null, expires_at: null, content_type: null });
    });
});

describe('get_usage', () => {
    test('flattens the usage response', async () => {
        const seen = stubFetch(replies([{ body: { plan: 'free', period: { start: '2026-11-01T00:00:00.000Z', end: '2026-11-30T23:59:59.000Z' }, usage: { screenshots_used: 12, screenshots_limit: 200, screenshots_remaining: 188, extra_credits: 0 } } }]));
        const { output } = await runAction({ action: getUsage, propsValue: {} });
        expect(seen[0].url).toBe('https://app.snap-render.com/v1/usage');
        expect(output).toEqual({ plan: 'free', captures_used: 12, captures_limit: 200, captures_remaining: 188, extra_credits: 0, period_start: '2026-11-01T00:00:00.000Z', period_end: '2026-11-30T23:59:59.000Z' });
        expect(missingSchemaPaths({ output, fields: snaprenderOutputSchemas.usage.fields })).toEqual([]);
    });
    test('an invalid key surfaces UNAUTHORIZED', async () => {
        stubFetch(replies([apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Missing or invalid API key.' })]));
        await expect(runAction({ action: getUsage, propsValue: {} })).rejects.toThrow('UNAUTHORIZED: Missing or invalid API key.');
    });
});
