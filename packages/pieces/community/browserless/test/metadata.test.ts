import { afterEach, describe, expect, test, vi } from 'vitest';
import { browserless } from '../src';
import { TOKEN, actionContext, replies, stubFetch } from './helpers';

const actions = Object.values(browserless.actions());
const nonCustom = actions.filter((action) => action.name !== 'custom_api_call');
const AUDIENCE: Record<string, string> = {
    capture_screenshot: 'human',
    generate_pdf: 'human',
    get_website_performance: 'human',
    take_screenshot: 'ai',
    create_pdf: 'ai',
    audit_page_performance: 'ai',
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('piece metadata', () => {
    test('19 actions, existing names kept', () => {
        expect(actions.map((action) => action.name).sort()).toEqual(
            [
                'cancel_crawl',
                'capture_screenshot',
                'custom_api_call',
                'generate_pdf',
                'get_crawl',
                'get_page_content',
                'get_website_performance',
                'list_crawls',
                'map_website',
                'run_bql_query',
                'run_function',
                'scrape_url',
                'search_web',
                'smart_scrape',
                'start_crawl',
                'unblock_page',
                'take_screenshot',
                'create_pdf',
                'audit_page_performance',
            ].sort(),
        );
    });
    test.each(nonCustom.map((action) => [action.name, action]))('%s declares audience, classification, aiMetadata and outputSchema', (_name, action) => {
        expect(action.audience).toBe(AUDIENCE[action.name] ?? 'both');
        expect(['READ', 'SEARCH', 'WRITE', 'DESTRUCTIVE']).toContain(action.classification);
        expect(action.aiMetadata?.description?.length ?? 0).toBeGreaterThan(80);
        expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
        expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
    });
    test('classification by side effect', () => {
        const byClass = (cls: string) => nonCustom.filter((action) => action.classification === cls).map((action) => action.name).sort();
        expect(byClass('DESTRUCTIVE')).toEqual(['cancel_crawl']);
        expect(byClass('WRITE')).toEqual(['run_bql_query', 'run_function']);
        expect(byClass('SEARCH')).toEqual(['list_crawls', 'map_website', 'search_web', 'start_crawl']);
    });
    test('ai actions never return base64 or the raw Lighthouse report', () => {
        for (const action of nonCustom.filter((item) => item.audience === 'ai')) {
            const keys = (action.outputSchema?.fields ?? []).map((field) => field.value ?? field.key);
            expect(keys.some((key) => /base64|fullReport/i.test(key))).toBe(false);
        }
    });
    test('existing action prop keys are kept', () => {
        const keys = (name: string) => Object.keys(browserless.actions()[name].props);
        expect(keys('capture_screenshot')).toEqual(expect.arrayContaining(['url', 'imageType', 'quality', 'fullPage', 'width', 'height', 'waitForSelector', 'delay', 'omitBackground', 'clipX', 'clipY', 'clipWidth', 'clipHeight']));
        expect(keys('generate_pdf')).toEqual(expect.arrayContaining(['url', 'html', 'format', 'landscape', 'printBackground', 'waitForSelector', 'waitForFunction', 'userAgent', 'timeout', 'bestAttempt']));
        expect(keys('scrape_url')).toEqual(expect.arrayContaining(['url', 'elements', 'waitForSelector', 'debugConsole', 'cookies', 'timeout', 'waitUntil', 'viewportWidth']));
        expect(keys('run_bql_query')).toEqual(expect.arrayContaining(['query', 'variables', 'operationName', 'timeout', 'stealth', 'proxy', 'cookies']));
        expect(keys('get_website_performance')).toEqual(expect.arrayContaining(['url', 'categories', 'device', 'throttling', 'onlyCategories', 'budgets', 'stealth', 'blockAds']));
    });
});

describe('custom API call', () => {
    const customCall = browserless.actions()['custom_api_call'];
    test('relative paths go to the connection host with the token', async () => {
        const seen = stubFetch(replies([{ body: { version: '2.40.0' } }]));
        const { context } = actionContext({ propsValue: { url: { url: '/meta' }, method: 'GET', headers: {}, queryParams: {}, failsafe: false } });
        await customCall.run(context);
        expect(seen[0].origin).toBe('https://production-sfo.browserless.io');
        expect(seen[0].path).toBe('/meta');
        expect(seen[0].query.get('token')).toBe(TOKEN);
    });
    test('absolute URLs on another host are refused before the token is sent', async () => {
        const seen = stubFetch(replies([{ body: {} }]));
        for (const url of ['https://production-sfo.browserless.io.evil.io/meta', 'https://evil.io/meta', 'http://production-sfo.browserless.io/meta']) {
            const { context } = actionContext({ propsValue: { url: { url }, method: 'GET', headers: {}, queryParams: {}, failsafe: false } });
            await expect(customCall.run(context)).rejects.toThrow(/only sends your Browserless token/);
        }
        expect(seen).toHaveLength(0);
    });
});
