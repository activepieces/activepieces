import { afterEach, describe, expect, test, vi } from 'vitest';
import { captureScreenshot } from '../src/lib/actions/capture-screenshot';
import { generatePdf } from '../src/lib/actions/generate-pdf';
import { getWebsitePerformance } from '../src/lib/actions/get-website-performance';
import { runBqlQuery } from '../src/lib/actions/run-bql-query';
import { scrapeUrl } from '../src/lib/actions/scrape-url';
import { browserlessOutputSchemas } from '../src/lib/output-schemas';
import { TOKEN, actionContext, missingSchemaPaths, replies, runAction, stubFetch } from './helpers';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff]);

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('capture_screenshot', () => {
    test('posts puppeteer options and stores the binary file', async () => {
        const seen = stubFetch(replies([{ binary: PNG, headers: { 'content-type': 'image/png', 'x-response-code': '200', 'x-response-url': 'https://example.com/' } }]));
        const { output, written } = await runAction({
            action: captureScreenshot,
            propsValue: { url: 'https://example.com', imageType: 'png', fullPage: true, quality: 80, width: 1280, height: 720, waitForSelector: ' h1 ', delay: 500 },
        });
        expect(seen[0].path).toBe('/screenshot');
        expect(seen[0].query.get('token')).toBe(TOKEN);
        expect(seen[0].body).toEqual({
            url: 'https://example.com',
            options: { type: 'png', fullPage: true },
            viewport: { width: 1280, height: 720 },
            waitForSelector: { selector: 'h1' },
            waitForTimeout: 500,
        });
        expect(written[0].fileName).toBe('screenshot.png');
        expect(written[0].data.equals(PNG)).toBe(true);
        expect(output).toMatchObject({ success: true, file: 'https://files.example/screenshot.png', screenshotBase64: PNG.toString('base64') });
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.captureScreenshot.fields })).toEqual([]);
    });
    test('jpeg/webp send quality and a full clip', async () => {
        const seen = stubFetch(replies([{ binary: PNG }]));
        await runAction({ action: captureScreenshot, propsValue: { url: 'https://example.com', imageType: 'webp', quality: 0, clipX: 0, clipY: 0, clipWidth: 100, clipHeight: 50 } });
        expect(seen[0].body).toMatchObject({ options: { type: 'webp', quality: 0, clip: { x: 0, y: 0, width: 100, height: 50 } } });
    });
    test('partial clip or half a viewport fails before the request', async () => {
        const seen = stubFetch(replies([{ binary: PNG }]));
        await expect(runAction({ action: captureScreenshot, propsValue: { url: 'https://example.com', clipX: 0, clipY: 0 } })).rejects.toThrow(/all four/);
        await expect(runAction({ action: captureScreenshot, propsValue: { url: 'https://example.com', width: 800 } })).rejects.toThrow(/Viewport Width and Viewport Height/);
        expect(seen).toHaveLength(0);
    });
});

describe('generate_pdf', () => {
    test('wait options go top-level, userAgent is an object, options stay puppeteer-only', async () => {
        const seen = stubFetch(replies([{ binary: Buffer.from('%PDF-1.7') }]));
        const { output, written } = await runAction({
            action: generatePdf,
            propsValue: {
                url: 'https://example.com',
                format: 'Letter',
                printBackground: true,
                marginTop: '10mm',
                scale: 1.2,
                timeout: 20000,
                waitForSelector: '#ready',
                waitForSelectorTimeout: 5000,
                waitForSelectorVisible: true,
                waitForSelectorHidden: false,
                waitForFunction: '() => window.done',
                waitForFunctionPolling: '100',
                userAgent: 'MyBot/1.0',
                waitForTimeout: 250,
                bestAttempt: true,
            },
        });
        expect(seen[0].path).toBe('/pdf');
        expect(seen[0].body).toEqual({
            url: 'https://example.com',
            options: { format: 'Letter', landscape: false, printBackground: true, displayHeaderFooter: false, margin: { top: '10mm' }, scale: 1.2 },
            gotoOptions: { timeout: 20000 },
            waitForSelector: { selector: '#ready', timeout: 5000, visible: true },
            waitForFunction: { fn: '() => window.done', polling: 100 },
            waitForTimeout: 250,
            userAgent: { userAgent: 'MyBot/1.0' },
            bestAttempt: true,
        });
        expect(written[0].fileName).toBe('document.pdf');
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.generatePdf.fields })).toEqual([]);
    });
    test('html source and exclusivity', async () => {
        const seen = stubFetch(replies([{ binary: Buffer.from('%PDF') }]));
        await runAction({ action: generatePdf, propsValue: { html: '<h1>Hi</h1>' } });
        expect(seen[0].body).toMatchObject({ html: '<h1>Hi</h1>' });
        await expect(runAction({ action: generatePdf, propsValue: {} })).rejects.toThrow(/Either URL or HTML/);
        await expect(runAction({ action: generatePdf, propsValue: { url: 'https://a.com', html: '<p>' } })).rejects.toThrow(/Cannot provide both/);
        await expect(runAction({ action: generatePdf, propsValue: { url: 'https://a.com', scale: 3 } })).rejects.toThrow(/Scale must be at most 2/);
    });
    test('a redirect from a custom endpoint fails instead of saving the redirect body as a PDF', async () => {
        stubFetch(replies([{ status: 302, text: '<a href="/login">Found</a>', headers: { location: 'https://proxy.example/login' } }]));
        const { context, written } = actionContext({ propsValue: { url: 'https://example.com' }, authProps: { region: 'custom', customBaseUrl: 'https://proxy.example' } });
        await expect(generatePdf.run(context)).rejects.toThrow(/Generate PDF failed: Browserless answered with status 302.*Redirects are not followed/);
        expect(written).toEqual([]);
    });
});

describe('scrape_url', () => {
    const scrapeResponse = {
        data: [{ selector: 'h1', results: [{ text: 'Example Domain', html: 'Example Domain', attributes: [{ name: 'class', value: 'title' }], width: 600, height: 38, top: 133, left: 660 }] }],
        debug: { console: [], cookies: [], html: null, network: { inbound: [], outbound: [] }, screenshot: null },
    };
    test('plain selectors, cookies get the page URL, userAgent object', async () => {
        const seen = stubFetch(replies([{ body: scrapeResponse, headers: { 'x-response-code': '200' } }]));
        const { output } = await runAction({
            action: scrapeUrl,
            propsValue: {
                url: 'https://example.com',
                elements: [{ selector: 'h1' }, { selector: '{"selector":"p"}', timeout: 1000 }],
                cookies: [{ name: 'sid', value: 'x' }, { name: 'a', value: 'b', domain: '.example.com' }, { name: '', value: 'skip' }],
                userAgent: 'Bot',
                timeout: 30000,
                waitUntil: 'networkidle2',
                viewportWidth: 1920,
                viewportHeight: 1080,
            },
        });
        expect(seen[0].path).toBe('/scrape');
        expect(seen[0].body).toEqual({
            url: 'https://example.com',
            elements: [{ selector: 'h1' }, { selector: 'p', timeout: 1000 }],
            gotoOptions: { timeout: 30000, waitUntil: 'networkidle2' },
            userAgent: { userAgent: 'Bot' },
            viewport: { width: 1920, height: 1080 },
            cookies: [
                { name: 'sid', value: 'x', url: 'https://example.com' },
                { name: 'a', value: 'b', domain: '.example.com' },
            ],
        });
        expect(output).toMatchObject({ success: true, data: scrapeResponse, metadata: { elementsCount: 2, site_status_code: 200 } });
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.scrapeUrl.fields })).toEqual([]);
    });
    test('advertised defaults are sent when an agent leaves them empty', async () => {
        const seen = stubFetch(replies([{ body: scrapeResponse }]));
        await runAction({ action: scrapeUrl, propsValue: { url: 'https://example.com', elements: [{ selector: 'h1' }], waitForSelector: '#main' } });
        expect(seen[0].body).toEqual({
            url: 'https://example.com',
            elements: [{ selector: 'h1' }],
            gotoOptions: { timeout: 30000, waitUntil: 'networkidle2' },
            waitForSelector: { selector: '#main', visible: true },
            viewport: { width: 1920, height: 1080 },
        });
    });
    test('a blank selector is refused', async () => {
        stubFetch(replies([{ body: scrapeResponse }]));
        await expect(runAction({ action: scrapeUrl, propsValue: { url: 'https://example.com', elements: [{ selector: ' ' }] } })).rejects.toThrow(/needs a CSS selector/);
    });
});

describe('run_bql_query', () => {
    test('posts to /chromium/bql with launch query params', async () => {
        const seen = stubFetch(replies([{ body: { data: { goto: { status: 200 } } } }]));
        const { output } = await runAction({
            action: runBqlQuery,
            propsValue: { query: 'mutation { goto(url: "https://example.com") { status } }', variables: {}, timeout: 30000, stealth: true, headless: true, proxy: 'residential', proxyCountry: 'us', viewportWidth: 800, viewportHeight: 600 },
        });
        expect(seen[0].path).toBe('/chromium/bql');
        expect(seen[0].query.get('token')).toBe(TOKEN);
        expect(seen[0].query.get('timeout')).toBe('30000');
        expect(seen[0].query.get('stealth')).toBe('true');
        expect(seen[0].query.get('proxy')).toBe('residential');
        expect(seen[0].query.get('proxyCountry')).toBe('us');
        expect(seen[0].query.get('viewport')).toBe('800x600');
        expect(seen[0].body).toEqual({ query: 'mutation { goto(url: "https://example.com") { status } }' });
        expect(output).toMatchObject({ success: true, data: { goto: { status: 200 } }, errors: null });
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.runBqlQuery.fields })).toEqual([]);
    });
    test('advertised defaults are sent when an agent leaves them empty', async () => {
        const seen = stubFetch(replies([{ body: { data: { goto: { status: 200 } } } }]));
        await runAction({ action: runBqlQuery, propsValue: { query: 'mutation { x }' } });
        expect(seen[0].query.get('timeout')).toBe('30000');
        expect(seen[0].query.get('stealth')).toBe('true');
        expect(seen[0].query.get('headless')).toBe('true');
    });
    test('unticked stealth and headless are sent as false', async () => {
        const seen = stubFetch(replies([{ body: { data: { goto: { status: 200 } } } }]));
        await runAction({ action: runBqlQuery, propsValue: { query: 'mutation { x }', stealth: false, headless: false } });
        expect(seen[0].query.get('stealth')).toBe('false');
        expect(seen[0].query.get('headless')).toBe('false');
    });
    test('errors without data fail the step', async () => {
        stubFetch(replies([{ body: { data: null, errors: [{ message: 'Timed out waiting for selector' }] } }]));
        await expect(runAction({ action: runBqlQuery, propsValue: { query: 'mutation { x }' } })).rejects.toThrow(/Run BQL Query failed: Timed out waiting for selector/);
    });
    test('partial data keeps the errors in the output', async () => {
        stubFetch(replies([{ body: { data: { goto: { status: 200 } }, errors: [{ message: 'click failed' }] } }]));
        const { output } = await runAction({ action: runBqlQuery, propsValue: { query: 'mutation { x }' } });
        expect(output).toMatchObject({ data: { goto: { status: 200 } }, errors: [{ message: 'click failed' }] });
    });
});

describe('get_website_performance', () => {
    const lhr = {
        lighthouseVersion: '12.2.0',
        finalDisplayedUrl: 'https://example.com/',
        categories: { performance: { score: 0 }, accessibility: { score: 0.91 }, 'best-practices': { score: 1 }, seo: { score: 0.5 } },
        audits: {
            'first-contentful-paint': { displayValue: '0.8 s', numericValue: 812, score: 0.98 },
            'largest-contentful-paint': { displayValue: '1.2 s', numericValue: 1200, score: 0 },
            'speed-index': { displayValue: '0.9 s', score: 1 },
            interactive: { displayValue: '1.0 s', score: 1 },
            'total-blocking-time': { displayValue: '0 ms', score: 1 },
            'cumulative-layout-shift': { displayValue: '0', score: 1 },
            'unused-javascript': { displayValue: 'Est savings of 20 KiB', details: { items: [{}] } },
        },
    };
    test('desktop audit sends matching screen emulation and keeps 0 scores', async () => {
        const seen = stubFetch(replies([{ body: { lhr } }]));
        const { output } = await runAction({
            action: getWebsitePerformance,
            propsValue: { url: 'https://example.com', device: 'desktop', throttling: 'mobileSlow4G', onlyCategories: true, locale: 'en-US', timeout: 60000, emulateMediaType: 'print', stealth: true },
        });
        expect(seen[0].path).toBe('/performance');
        expect(seen[0].query.get('stealth')).toBe('true');
        expect(seen[0].body).toEqual({
            url: 'https://example.com',
            config: {
                extends: 'lighthouse:default',
                settings: {
                    formFactor: 'desktop',
                    screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
                    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
                    locale: 'en-US',
                    throttlingMethod: 'simulate',
                    throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
                    maxWaitForLoad: 60000,
                },
            },
        });
        expect(output).toMatchObject({
            summary: {
                scores: { performance: 0, accessibility: 91, bestPractices: 100, seo: 50, pwa: null },
                metrics: { largestContentfulPaint: { value: '1.2 s', numericValue: 1200, score: 0 } },
                opportunities: [{ type: 'unused-javascript', potentialSavings: 'Est savings of 20 KiB' }],
                finalUrl: 'https://example.com/',
            },
            fullReport: { lhr },
            metadata: { lighthouseVersion: '12.2.0' },
        });
        expect(missingSchemaPaths({ output, fields: browserlessOutputSchemas.getWebsitePerformance.fields })).toEqual([]);
    });
    test('reads the live response shape { type, data: lhr }', async () => {
        stubFetch(replies([{ body: { type: 'json', data: lhr } }]));
        const { output } = await runAction({ action: getWebsitePerformance, propsValue: { url: 'https://example.com', includeFullReport: false } });
        expect(output).toMatchObject({ summary: { scores: { performance: 0, seo: 50 }, finalUrl: 'https://example.com/' }, metadata: { lighthouseVersion: '12.2.0' } });
    });
    test('mobile emulation, no throttling, categories deduped, full report optional', async () => {
        const seen = stubFetch(replies([{ body: { lhr } }]));
        const { output } = await runAction({
            action: getWebsitePerformance,
            propsValue: { url: 'https://example.com', device: 'mobile', throttling: 'none', categories: [{ category: 'seo' }, { category: 'seo' }], includeFullReport: false },
        });
        expect(seen[0].body).toMatchObject({ config: { settings: { formFactor: 'mobile', screenEmulation: { mobile: true }, onlyCategories: ['seo'], throttlingMethod: 'provided' } } });
        expect(output).not.toHaveProperty('fullReport');
    });
});
