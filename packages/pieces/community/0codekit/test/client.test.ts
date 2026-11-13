import { HttpError } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { zeroCodeKitAuth } from '../src/lib/auth';
import { zeroCodeKitApi } from '../src/lib/common/client';
import { authValidationServerContext } from './helpers';

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

function httpError({ status, body }: { status: number; body: unknown }) {
    return new HttpError({}, { status, responseBody: body });
}

function validate(auth: string) {
    return zeroCodeKitAuth.validate?.({ auth, server: authValidationServerContext() });
}

beforeEach(() => {
    sendRequest.mockReset();
});

describe('client', () => {
    it('POSTs JSON to v2.1saas.co with the key in the auth header', async () => {
        sendRequest.mockResolvedValueOnce({ body: { ok: true } });

        await zeroCodeKitApi.post({ apiKey: 'k1', path: '/generate/city', body: { a: 1 } });

        const request = sendRequest.mock.calls[0][0];
        expect(request.method).toBe('POST');
        expect(request.url).toBe('https://v2.1saas.co/generate/city');
        expect(request.headers).toEqual({ auth: 'k1' });
        expect(request.body).toEqual({ a: 1 });
    });

    it('drops undefined, null and empty-string fields so API defaults apply', async () => {
        sendRequest.mockResolvedValueOnce({ body: {} });

        await zeroCodeKitApi.post({
            apiKey: 'k1',
            path: '/x',
            body: { keep: 'v', zero: 0, off: false, gone: undefined, nothing: null, empty: '' },
        });

        expect(sendRequest.mock.calls[0][0].body).toEqual({ keep: 'v', zero: 0, off: false });
    });

    it('sends an empty object when no body is given', async () => {
        sendRequest.mockResolvedValueOnce({ body: {} });

        await zeroCodeKitApi.post({ apiKey: 'k1', path: '/generate/city' });

        expect(sendRequest.mock.calls[0][0].body).toEqual({});
    });

    it('rewrites 0CodeKit error envelopes into a readable message', async () => {
        sendRequest.mockRejectedValueOnce(
            httpError({ status: 400, body: { status: 400, errorMessage: 'Error at `body.iban`: Required.', code: 'bad_request' } }),
        );

        await expect(zeroCodeKitApi.post({ apiKey: 'k1', path: '/business/validate/iban' })).rejects.toThrow(
            '0CodeKit returned 400: Error at `body.iban`: Required. (bad_request)',
        );
    });
});

describe('auth', () => {
    it('accepts a key that /1saas/auth authorizes', async () => {
        sendRequest.mockResolvedValueOnce({ body: { message: 'You are authorized.' } });

        await expect(validate('good')).resolves.toEqual({ valid: true });
        expect(sendRequest.mock.calls[0][0].url).toBe('https://v2.1saas.co/1saas/auth');
        expect(sendRequest.mock.calls[0][0].headers).toEqual({ auth: 'good' });
    });

    it('rejects a key 0CodeKit answers with 401', async () => {
        sendRequest.mockRejectedValueOnce(
            httpError({ status: 401, body: { status: 401, errorMessage: 'Invalid API key.', code: 'unauthorized' } }),
        );

        const result = await validate('bad');

        expect(result).toMatchObject({ valid: false });
        expect(result?.valid === false && result.error).toMatch(/rejected this API key/);
    });

    it('reports other failures as a reachability problem, not a bad key', async () => {
        sendRequest.mockRejectedValueOnce(httpError({ status: 503, body: { errorMessage: 'Down for maintenance' } }));

        const result = await validate('any');

        expect(result?.valid === false && result.error).toMatch(/Could not reach 0CodeKit.*503.*Down for maintenance/);
    });
});
