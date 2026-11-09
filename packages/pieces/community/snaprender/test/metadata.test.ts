import { afterEach, describe, expect, test, vi } from 'vitest';
import { snaprender } from '../src';
import { API_KEY, actionContext, replies, stubFetch } from './helpers';

const actions = Object.values(snaprender.actions());
const handWritten = actions.filter((action) => action.name !== 'custom_api_call');

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('piece metadata', () => {
    test('exposes the expected actions', () => {
        expect(actions.map((action) => action.name).sort()).toEqual(
            [
                'batch_screenshots',
                'check_cache',
                'create_pdf',
                'custom_api_call',
                'extract_content',
                'get_batch_status',
                'get_usage',
                'render_html',
                'sign_screenshot_url',
                'take_screenshot',
            ].sort(),
        );
    });
    test('piece fields', () => {
        expect(snaprender.displayName).toBe('SnapRender');
        expect(snaprender.minimumSupportedRelease).toBe('0.88.2');
        expect(snaprender.authors).toEqual(['User0856']);
        expect(snaprender.logoUrl).toMatch(/^https:\/\//);
        expect(Object.keys(snaprender.triggers())).toEqual([]);
    });
    test.each(handWritten.map((action) => [action.name, action]))('%s declares audience, classification, aiMetadata and outputSchema', (_name, action) => {
        expect(action.audience).toBe('both');
        expect(['READ', 'SEARCH', 'WRITE', 'DESTRUCTIVE']).toContain(action.classification);
        expect(action.aiMetadata?.description?.length ?? 0).toBeGreaterThan(80);
        expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
        expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
    });
    test('only Batch Screenshots changes state on SnapRender', () => {
        const writes = handWritten.filter((action) => action.classification !== 'READ').map((action) => action.name);
        expect(writes).toEqual(['batch_screenshots']);
    });
    test('free lookups are idempotent, captures are not', () => {
        const idempotent = handWritten.filter((action) => action.aiMetadata?.idempotent === true).map((action) => action.name).sort();
        expect(idempotent).toEqual(['check_cache', 'get_batch_status', 'get_usage', 'sign_screenshot_url']);
    });
    test('required props are never hidden under Advanced', () => {
        for (const action of handWritten) {
            for (const [key, prop] of Object.entries(action.props)) {
                const hidden = typeof prop === 'object' && prop !== null && 'advanced' in prop && prop.advanced === true && 'required' in prop && prop.required === true;
                expect(hidden, `${action.name}.${key}`).toBe(false);
            }
        }
    });
    test('user-facing text has no em dashes or filler words', () => {
        const texts: string[] = [snaprender.displayName, snaprender.description, snaprender.auth && 'description' in snaprender.auth ? String(snaprender.auth.description) : ''];
        for (const action of handWritten) {
            texts.push(action.displayName, action.description, action.aiMetadata?.description ?? '');
            for (const prop of Object.values(action.props)) {
                texts.push(JSON.stringify(prop));
            }
        }
        const joined = texts.join('\n');
        expect(joined).not.toMatch(/\u2014|\u2013/);
        expect(joined).not.toMatch(/\b(seamless(ly)?|comprehensive|unlock|ecosystem|delve|leverage|effortless(ly)?|robust)\b/i);
    });
});

describe('custom API call', () => {
    const customCall = snaprender.actions()['custom_api_call'];
    const propsFor = (url: string) => ({ url: { url }, method: 'GET', headers: {}, queryParams: {}, failsafe: false });
    test('relative paths go to app.snap-render.com with the X-API-Key header', async () => {
        const seen = stubFetch(replies([{ body: { plan: 'free' } }]));
        const { context } = actionContext({ propsValue: propsFor('/v1/usage') });
        await customCall.run(context);
        expect(seen[0].url).toBe('https://app.snap-render.com/v1/usage');
        expect(seen[0].headers.get('x-api-key')).toBe(API_KEY);
    });
    test('a full SnapRender URL is allowed', async () => {
        const seen = stubFetch(replies([{ body: {} }]));
        const { context } = actionContext({ propsValue: propsFor('https://app.snap-render.com/v1/webhooks') });
        await customCall.run(context);
        expect(seen[0].url).toBe('https://app.snap-render.com/v1/webhooks');
    });
    test('other hosts are refused before the key is sent', async () => {
        const seen = stubFetch(replies([{ body: {} }]));
        for (const url of [
            'https://evil.example/v1/usage',
            'https://app.snap-render.com.evil.example/v1/usage',
            'https://app.snap-render.com@evil.example/v1/usage',
            'http://app.snap-render.com/v1/usage',
            'HTTPS://evil.example/v1/usage',
        ]) {
            const { context } = actionContext({ propsValue: propsFor(url) });
            await expect(customCall.run(context)).rejects.toThrow(/only sends your SnapRender API key/);
        }
        expect(seen).toHaveLength(0);
    });
});
