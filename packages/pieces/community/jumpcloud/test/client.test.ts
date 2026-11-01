import { HttpError, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JUMPCLOUD_REGION, jumpcloudApi } from '../src/lib/common/client';

const sendRequest = vi.fn();

beforeEach(() => {
    sendRequest.mockReset();
    vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => sendRequest(request));
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('resolveBaseUrl', () => {
    it.each([
        [JUMPCLOUD_REGION.US, 'https://console.jumpcloud.com/api'],
        [JUMPCLOUD_REGION.EU, 'https://console.eu.jumpcloud.com/api'],
        [JUMPCLOUD_REGION.IN, 'https://console.in.jumpcloud.com/api'],
        [undefined, 'https://console.jumpcloud.com/api'],
        ['unknown', 'https://console.jumpcloud.com/api'],
    ])('maps region %s to %s', (region, expected) => {
        expect(jumpcloudApi.resolveBaseUrl({ region })).toBe(expected);
    });
});

describe('authHeaders', () => {
    it('sends the trimmed API key without an org header by default', () => {
        expect(jumpcloudApi.authHeaders({ apiKey: ' key ' })).toEqual({ 'x-api-key': 'key', Accept: 'application/json' });
    });

    it('adds x-org-id when an organization ID is set', () => {
        expect(jumpcloudApi.authHeaders({ apiKey: 'key', orgId: ' org-1 ' })).toEqual({
            'x-api-key': 'key',
            Accept: 'application/json',
            'x-org-id': 'org-1',
        });
    });

    it('skips a blank organization ID', () => {
        expect(jumpcloudApi.authHeaders({ apiKey: 'key', orgId: '  ' })).not.toHaveProperty('x-org-id');
    });
});

describe('describeError', () => {
    it('adds the API message and a hint for known statuses', () => {
        const error = new HttpError({}, { status: 401, responseBody: { message: 'Unauthorized' } });
        expect(jumpcloudApi.describeError(error)).toBe(
            'JumpCloud API error (HTTP 401): Unauthorized. Check the API key in the connection. In the JumpCloud Admin Portal, open your account menu and choose My API Key.',
        );
    });

    it('reads nested and string error bodies', () => {
        expect(jumpcloudApi.describeError(new HttpError({}, { status: 500, responseBody: { error: { message: 'boom' } } }))).toBe(
            'JumpCloud API error (HTTP 500): boom',
        );
        expect(jumpcloudApi.describeError(new HttpError({}, { status: 500, responseBody: '{"error":"bad"}' }))).toBe(
            'JumpCloud API error (HTTP 500): bad',
        );
        expect(jumpcloudApi.describeError(new HttpError({}, { status: 502, responseBody: 'Bad Gateway' }))).toBe(
            'JumpCloud API error (HTTP 502): Bad Gateway',
        );
    });

    it('omits the detail when the body has no message', () => {
        expect(jumpcloudApi.describeError(new HttpError({}, { status: 429, responseBody: {} }))).toBe(
            'JumpCloud API error (HTTP 429). JumpCloud is rate-limiting requests. Wait a minute and run the step again.',
        );
    });

    it('drops HTML error pages', () => {
        expect(jumpcloudApi.describeError(new HttpError({}, { status: 404, responseBody: '<html><body>404 Not Found</body></html>' }))).toBe(
            'JumpCloud API error (HTTP 404). Check that the object exists, and that the connection region is correct.',
        );
    });

    it('explains network failures', () => {
        const refused = new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } });
        expect(jumpcloudApi.describeError(refused)).toBe(
            'Could not reach the JumpCloud API (ECONNREFUSED). Check the connection region and your network.',
        );
        expect(jumpcloudApi.describeError(new TypeError('fetch failed'))).toContain('Could not reach the JumpCloud API (fetch failed)');
    });

    it('passes through other errors', () => {
        expect(jumpcloudApi.describeError(new Error('boom'))).toBe('boom');
        expect(jumpcloudApi.describeError('boom')).toBe('boom');
    });
});

describe('validateConnection', () => {
    it('calls the users endpoint of the selected region with the connection headers', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: { totalCount: 0, results: [] } });

        const result = await jumpcloudApi.validateConnection({ apiKey: 'key', region: JUMPCLOUD_REGION.EU, orgId: 'org-1' });

        expect(result).toEqual({ valid: true });
        expect(sendRequest).toHaveBeenCalledWith({
            method: HttpMethod.GET,
            url: 'https://console.eu.jumpcloud.com/api/systemusers',
            headers: { 'x-api-key': 'key', Accept: 'application/json', 'x-org-id': 'org-1' },
            queryParams: { limit: '1' },
        });
    });

    it('returns an actionable error for a rejected key', async () => {
        sendRequest.mockRejectedValue(new HttpError({}, { status: 401, responseBody: { message: 'Unauthorized' } }));

        const result = await jumpcloudApi.validateConnection({ apiKey: 'bad', region: JUMPCLOUD_REGION.US });

        expect(result).toEqual({ valid: false, error: expect.stringContaining('HTTP 401') });
    });

    it('returns an actionable error when JumpCloud is unreachable', async () => {
        sendRequest.mockRejectedValue(new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } }));

        const result = await jumpcloudApi.validateConnection({ apiKey: 'key', region: JUMPCLOUD_REGION.IN });

        expect(result).toEqual({ valid: false, error: expect.stringContaining('Could not reach the JumpCloud API (ENOTFOUND)') });
    });
});
