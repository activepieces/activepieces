import { beforeEach, describe, expect, it, vi } from 'vitest';
import { advancedSwitchWithUrlAction } from '../src/lib/actions/url/advanced-switch-with-url';
import { createCustomShortenedUrlAction } from '../src/lib/actions/url/create-custom-shortened-url';
import { createShortenedUrlAction } from '../src/lib/actions/url/create-shortened-url';
import { deleteShortenedUrlAction } from '../src/lib/actions/url/delete-shortened-url';
import { getAShortenedUrlAction } from '../src/lib/actions/url/get-a-shortened-url';
import { listShortenedUrlsAction } from '../src/lib/actions/url/list-shortened-urls';
import { updateShortenedUrlAction } from '../src/lib/actions/url/update-shortened-url';
import { urlExpanderAction } from '../src/lib/actions/url/url-expander';
import { utmBuildAction } from '../src/lib/actions/url/utm-build';
import { utmParseAction } from '../src/lib/actions/url/utm-parse';
import { zeroCodeKitUrl } from '../src/lib/common/url';
import { loadDropdownOptions, runAction, TEST_AUTH } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
    return {
        ...actual,
        httpClient: {
            sendRequest: (...args: unknown[]) => sendRequest(...args),
        },
    };
});

function respond(body: unknown) {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function sent(index = 0) {
    return sendRequest.mock.calls[index][0];
}

beforeEach(() => {
    sendRequest.mockReset();
});

describe('url metadata', () => {
    const actions: [string, MetadataAction, string, boolean][] = [
        ['Create Shortened Url', createShortenedUrlAction, 'WRITE', false],
        ['Create Custom Shortened Url', createCustomShortenedUrlAction, 'WRITE', false],
        ['Delete Shortened Url', deleteShortenedUrlAction, 'DESTRUCTIVE', false],
        ['Get a Shortened Url', getAShortenedUrlAction, 'READ', true],
        ['List Shortened Urls', listShortenedUrlsAction, 'SEARCH', true],
        ['Update Shortened Url', updateShortenedUrlAction, 'WRITE', true],
        ['URL Expander', urlExpanderAction, 'READ', true],
        ['UTM Build', utmBuildAction, 'READ', true],
        ['UTM Parse', utmParseAction, 'READ', true],
        ['Advanced Switch with URL', advancedSwitchWithUrlAction, 'READ', true],
    ];

    it.each(actions)('%s has the expected metadata', (displayName, action, classification, idempotent) => {
        expect(action.displayName).toBe(displayName);
        expect(action.classification).toBe(classification);
        expect(action.audience).toBe('both');
        expect(action.aiMetadata?.idempotent).toBe(idempotent);
        expect(action.aiMetadata?.description?.length).toBeGreaterThan(20);
    });
});

describe('shortened urls', () => {
    it('Create sends only the destination with the auth header', async () => {
        respond({ shortenedUrl: 'https://lyl.ai/to4w5vyb', identifier: 'to4w5vyb' });
        const result = await runAction({ action: createShortenedUrlAction, propsValue: { destination: ' https://0codekit.com ' } });
        expect(sent().url).toBe('https://v2.1saas.co/generate/shortenedurl/add');
        expect(sent().headers).toEqual({ auth: 'zck_test' });
        expect(sent().body).toEqual({ destination: 'https://0codekit.com' });
        expect(result).toEqual({
            identifier: 'to4w5vyb',
            short_url: 'https://lyl.ai/to4w5vyb',
            destination: 'https://0codekit.com',
        });
    });

    it('Create Custom sends the custom ending', async () => {
        respond({ shortenedUrl: 'https://lyl.ai/summer', identifier: 'summer' });
        const result = await runAction({ action: createCustomShortenedUrlAction, propsValue: { destination: 'https://0codekit.com', custom: ' summer ' } });
        expect(sent().url).toBe('https://v2.1saas.co/generate/shortenedurl/add');
        expect(sent().body).toEqual({ destination: 'https://0codekit.com', custom: 'summer' });
        expect(result).toEqual({ identifier: 'summer', short_url: 'https://lyl.ai/summer', destination: 'https://0codekit.com' });
    });

    it('Create Custom rejects a blank ending', async () => {
        await expect(runAction({ action: createCustomShortenedUrlAction, propsValue: { destination: 'https://a.com', custom: '  ' } })).rejects.toThrow(/custom ending/);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('Delete sends the identifier', async () => {
        respond({ message: 'Successfully deleted shortened URL with id to4w5vyb.' });
        const result = await runAction({ action: deleteShortenedUrlAction, propsValue: { identifier: 'to4w5vyb' } });
        expect(sent().url).toBe('https://v2.1saas.co/generate/shortenedurl/del');
        expect(sent().body).toEqual({ identifier: 'to4w5vyb' });
        expect(result).toEqual({
            deleted: true,
            identifier: 'to4w5vyb',
            short_url: 'https://lyl.ai/to4w5vyb',
            message: 'Successfully deleted shortened URL with id to4w5vyb.',
        });
    });

    it('Get returns the destination', async () => {
        respond({ destination: 'https://0codekit.com' });
        const result = await runAction({ action: getAShortenedUrlAction, propsValue: { identifier: 'to4w5vyb' } });
        expect(sent().url).toBe('https://v2.1saas.co/generate/shortenedurl/get');
        expect(sent().body).toEqual({ identifier: 'to4w5vyb' });
        expect(result).toEqual({ identifier: 'to4w5vyb', short_url: 'https://lyl.ai/to4w5vyb', destination: 'https://0codekit.com' });
    });

    it('List returns flat links with a count', async () => {
        respond({ shortenedUrls: [{ identifier: 'a1', createdAt: '2026-01-01T00:00:00.000Z', destination: 'https://a.com' }] });
        const result = await runAction({ action: listShortenedUrlsAction, propsValue: {} });
        expect(sent().url).toBe('https://v2.1saas.co/generate/shortenedurl/list');
        expect(result).toEqual({
            count: 1,
            shortened_urls: [
                { identifier: 'a1', short_url: 'https://lyl.ai/a1', destination: 'https://a.com', created_at: '2026-01-01T00:00:00.000Z' },
            ],
        });
    });

    it('Update sends identifier and new destination', async () => {
        respond({ newDestination: 'https://example.com', identifier: 'a1' });
        const result = await runAction({ action: updateShortenedUrlAction, propsValue: { identifier: 'a1', destination: ' https://example.com ' } });
        expect(sent().url).toBe('https://v2.1saas.co/generate/shortenedurl/put');
        expect(sent().body).toEqual({ identifier: 'a1', destination: 'https://example.com' });
        expect(result).toEqual({ identifier: 'a1', short_url: 'https://lyl.ai/a1', destination: 'https://example.com' });
    });

    it('surfaces 0CodeKit error messages', async () => {
        sendRequest.mockRejectedValueOnce(new Error('boom'));
        await expect(runAction({ action: getAShortenedUrlAction, propsValue: { identifier: 'missing' } })).rejects.toThrow('boom');
    });
});

describe('url tools', () => {
    it('URL Expander returns the expanded URL', async () => {
        respond({ unshortenedUrl: 'https://example.com/long/page' });
        const result = await runAction({ action: urlExpanderAction, propsValue: { url: ' https://bit.ly/abc ' } });
        expect(sent().url).toBe('https://v2.1saas.co/operator/urlexpander');
        expect(sent().body).toEqual({ url: 'https://bit.ly/abc' });
        expect(result).toEqual({ short_url: 'https://bit.ly/abc', expanded_url: 'https://example.com/long/page' });
    });

    it('UTM Build nests only filled parameters under utm', async () => {
        respond({ url: 'https://example.com/?utm_source=news&utm_campaign=spring' });
        const result = await runAction({ action: utmBuildAction, propsValue: {
            url: 'https://example.com/',
            utmSource: ' news ',
            utmMedium: '',
            utmCampaign: 'spring',
        } });
        expect(sent().url).toBe('https://v2.1saas.co/operator/utm/build');
        expect(sent().body).toEqual({ url: 'https://example.com/', utm: { utm_source: 'news', utm_campaign: 'spring' } });
        expect(result).toEqual({ url: 'https://example.com/?utm_source=news&utm_campaign=spring' });
    });

    it('UTM Parse returns null for missing parameters', async () => {
        respond({ utm_source: 'news', utm_medium: 'email' });
        const result = await runAction({ action: utmParseAction, propsValue: { url: 'https://example.com/?utm_source=news&utm_medium=email' } });
        expect(sent().url).toBe('https://v2.1saas.co/operator/utm/parse');
        expect(result).toEqual({ utm_source: 'news', utm_medium: 'email', utm_campaign: null, utm_content: null, utm_term: null });
    });

    it('Advanced Switch with URL sends external JSON URL and keys', async () => {
        respond({ found: ['Germany', 'France'] });
        const result = await runAction({ action: advancedSwitchWithUrlAction, propsValue: { jsonUrl: ' https://example.com/map.json ', keys: ['DE', ' FR ', ''] } });
        expect(sent().url).toBe('https://v2.1saas.co/operator/advancedswitch');
        expect(sent().body).toEqual({ external: true, json: 'https://example.com/map.json', key: ['DE', 'FR'] });
        expect(result).toEqual({ found: true, count: 2, first_value: 'Germany', values: ['Germany', 'France'] });
    });

    it('Advanced Switch with URL wraps a single value', async () => {
        respond({ found: 'Germany' });
        const result = await runAction({ action: advancedSwitchWithUrlAction, propsValue: { jsonUrl: 'https://example.com/map.json', keys: ['DE'] } });
        expect(result).toEqual({ found: true, count: 1, first_value: 'Germany', values: ['Germany'] });
    });

    it('Advanced Switch with URL rejects empty keys', async () => {
        await expect(runAction({ action: advancedSwitchWithUrlAction, propsValue: { jsonUrl: 'https://a.com/x.json', keys: [' '] } })).rejects.toThrow(/at least one key/);
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

describe('shortened url dropdown', () => {
    it('labels options with short link and destination', async () => {
        respond({ shortenedUrls: [{ identifier: 'a1', createdAt: 'x', destination: 'https://a.com' }] });
        const prop = zeroCodeKitUrl.shortenedUrlIdentifier({ description: 'd' });
        const options = await loadDropdownOptions({ dropdown: prop, auth: TEST_AUTH });
        expect(sent().url).toBe('https://v2.1saas.co/generate/shortenedurl/list');
        expect(options).toEqual({ disabled: false, options: [{ label: 'https://lyl.ai/a1 → https://a.com', value: 'a1' }] });
    });

    it('asks for a connection first', async () => {
        const prop = zeroCodeKitUrl.shortenedUrlIdentifier({ description: 'd' });
        const options = await loadDropdownOptions({ dropdown: prop, auth: undefined });
        expect(options).toMatchObject({ disabled: true });
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('shows an empty-state placeholder', async () => {
        respond({ shortenedUrls: [] });
        const prop = zeroCodeKitUrl.shortenedUrlIdentifier({ description: 'd' });
        const options = await loadDropdownOptions({ dropdown: prop, auth: TEST_AUTH });
        expect(options).toMatchObject({ disabled: true, placeholder: 'No shortened URLs found. Create one first.' });
    });
});

type MetadataAction = {
    displayName: string;
    classification?: string;
    audience?: string;
    aiMetadata?: { description?: string; idempotent?: boolean };
};
