/// <reference types="vitest/globals" />

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', () => ({
    HttpMethod: { GET: 'GET', POST: 'POST', PUT: 'PUT', DELETE: 'DELETE' },
    httpClient: {
        sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
}));

import { clayWebhook } from '../src/lib/common/webhook';

const FIXTURE_SECRET =
    'whsec_testonlyfixture000000000000000000000000000000000000000000000';
const FIXTURE_BODY =
    '{"webhookId":"wh_fixture","createdAt":"2026-09-02T13:25:15.924Z","data":{"Domain":"activepieces.com"}}';
const FIXTURE_SIGNATURE =
    'sha256=f787d8f6ca1d5ea61ac6ae74dceb201cafc5b41ccd1593522c1344837d102c19';

const lastRequest = () => sendRequest.mock.calls.at(-1)?.[0];

function httpError(status: number) {
    return Object.assign(new Error(`Request failed with status ${status}`), {
        response: { status, body: { message: 'nope' } },
    });
}

describe('signature verification', () => {
    test('a signature Clay would send is accepted', () => {
        expect(
            clayWebhook.verifySignature({
                signingSecret: FIXTURE_SECRET,
                rawBody: FIXTURE_BODY,
                signatureHeader: FIXTURE_SIGNATURE,
            }),
        ).toBe(true);
    });

    test('the whsec_ prefix is part of the key, not stripped like Standard Webhooks does', () => {
        const standardWebhooksSignature =
            'sha256=b0169390732d1cb7ae61f1927bd7c5ac181d1c6262331cabf5a28545d0719efa';

        expect(
            clayWebhook.verifySignature({
                signingSecret: FIXTURE_SECRET,
                rawBody: FIXTURE_BODY,
                signatureHeader: standardWebhooksSignature,
            }),
        ).toBe(false);
    });

    test('a tampered body is rejected', () => {
        expect(
            clayWebhook.verifySignature({
                signingSecret: FIXTURE_SECRET,
                rawBody: FIXTURE_BODY.replace('activepieces.com', 'evil.com'),
                signatureHeader: FIXTURE_SIGNATURE,
            }),
        ).toBe(false);
    });

    test('a different secret is rejected', () => {
        expect(
            clayWebhook.verifySignature({
                signingSecret: 'whsec_someoneelsessecret',
                rawBody: FIXTURE_BODY,
                signatureHeader: FIXTURE_SIGNATURE,
            }),
        ).toBe(false);
    });

    test('a signature without the sha256= prefix still verifies', () => {
        expect(
            clayWebhook.verifySignature({
                signingSecret: FIXTURE_SECRET,
                rawBody: FIXTURE_BODY,
                signatureHeader: FIXTURE_SIGNATURE.replace('sha256=', ''),
            }),
        ).toBe(true);
    });

    test('a parsed body is rejected, since re-serialising changes the bytes', () => {
        expect(
            clayWebhook.verifySignature({
                signingSecret: FIXTURE_SECRET,
                rawBody: JSON.parse(FIXTURE_BODY),
                signatureHeader: FIXTURE_SIGNATURE,
            }),
        ).toBe(false);
    });

    test('a missing signature header is rejected', () => {
        expect(
            clayWebhook.verifySignature({
                signingSecret: FIXTURE_SECRET,
                rawBody: FIXTURE_BODY,
                signatureHeader: undefined,
            }),
        ).toBe(false);
    });

    test('an empty signature is rejected rather than throwing', () => {
        expect(
            clayWebhook.verifySignature({
                signingSecret: FIXTURE_SECRET,
                rawBody: FIXTURE_BODY,
                signatureHeader: 'sha256=',
            }),
        ).toBe(false);
    });

    test('the header is found whatever its casing', () => {
        expect(
            clayWebhook.signatureHeaderOf({ 'X-Clay-Signature': 'sha256=abc' }),
        ).toBe('sha256=abc');
        expect(
            clayWebhook.signatureHeaderOf({ 'x-clay-signature': 'sha256=abc' }),
        ).toBe('sha256=abc');
        expect(clayWebhook.signatureHeaderOf({ other: 'x' })).toBeUndefined();
        expect(clayWebhook.signatureHeaderOf(undefined)).toBeUndefined();
    });
});

describe('the verification ping Clay sends when a webhook is created', () => {
    test('an enveloped delivery with an empty row is a ping', () => {
        expect(
            clayWebhook.isVerificationPing({
                webhookId: 'wh_x',
                createdAt: '2026-09-02',
                data: {},
            }),
        ).toBe(true);
    });

    test('an enveloped delivery carrying a row is not a ping', () => {
        expect(
            clayWebhook.isVerificationPing({
                webhookId: 'wh_x',
                createdAt: '2026-09-02',
                data: { Domain: 'activepieces.com' },
            }),
        ).toBe(false);
    });

    test('a flat payload from an HTTP API column is never a ping', () => {
        expect(
            clayWebhook.isVerificationPing({ Domain: 'activepieces.com' }),
        ).toBe(false);
        expect(
            clayWebhook.isVerificationPing({ Domain: 'stripe.com', Company: 'Stripe' }),
        ).toBe(false);
        expect(clayWebhook.isVerificationPing({})).toBe(false);
    });
});

describe('webhook URL handling', () => {
    test('surrounding whitespace is trimmed', () => {
        expect(
            clayWebhook.normalizeSourceUrl('  https://api.clay.com/v3/sources/webhook/x  '),
        ).toBe('https://api.clay.com/v3/sources/webhook/x');
    });

    test('a URL without a scheme is refused rather than guessed at', () => {
        expect(() =>
            clayWebhook.normalizeSourceUrl('api.clay.com/v3/sources/webhook/x'),
        ).toThrow(/http/i);
    });

    test('a blank URL is refused', () => {
        expect(() => clayWebhook.normalizeSourceUrl('   ')).toThrow(/required/i);
    });

    test('http is accepted, since a source may be proxied', () => {
        expect(clayWebhook.normalizeSourceUrl('http://localhost:3001/hook')).toBe(
            'http://localhost:3001/hook',
        );
    });
});

describe('sending a row', () => {
    beforeEach(() => sendRequest.mockReset());

    test('the token travels in the x-clay-webhook-auth header', async () => {
        sendRequest.mockResolvedValueOnce({ body: { success: true } });
        await clayWebhook.sendRow({
            webhookUrl: 'https://api.clay.com/v3/sources/webhook/x',
            authToken: 'a-token',
            row: { Domain: 'activepieces.com' },
        });

        expect(lastRequest().headers).toEqual({ 'x-clay-webhook-auth': 'a-token' });
    });

    test('no header is sent when the source has no token', async () => {
        sendRequest.mockResolvedValueOnce({ body: { success: true } });
        await clayWebhook.sendRow({
            webhookUrl: 'https://api.clay.com/v3/sources/webhook/x',
            row: { Domain: 'activepieces.com' },
        });

        expect(lastRequest().headers).toBeUndefined();
    });

    test('the row is sent as the request body, flat', async () => {
        sendRequest.mockResolvedValueOnce({ body: { success: true } });
        await clayWebhook.sendRow({
            webhookUrl: 'https://api.clay.com/v3/sources/webhook/x',
            row: { Domain: 'activepieces.com', Company: 'Activepieces' },
        });

        expect(lastRequest().method).toBe('POST');
        expect(lastRequest().body).toEqual({
            Domain: 'activepieces.com',
            Company: 'Activepieces',
        });
    });

    test('a JSON acknowledgement is reported alongside a stable success flag', async () => {
        sendRequest.mockResolvedValueOnce({ body: { success: true } });

        await expect(
            clayWebhook.sendRow({
                webhookUrl: 'https://api.clay.com/v3/sources/webhook/x',
                row: {},
            }),
        ).resolves.toEqual({ success: true, response: { success: true } });
    });

    test('a plaintext acknowledgement keeps the same success flag', async () => {
        sendRequest.mockResolvedValueOnce({ body: 'OK' });

        await expect(
            clayWebhook.sendRow({
                webhookUrl: 'https://api.clay.com/v3/sources/webhook/x',
                row: {},
            }),
        ).resolves.toEqual({ success: true, response: 'OK' });
    });

    test('a 401 with no token names the field to fill in', async () => {
        sendRequest.mockRejectedValueOnce(httpError(401));

        await expect(
            clayWebhook.sendRow({
                webhookUrl: 'https://api.clay.com/v3/sources/webhook/x',
                row: {},
            }),
        ).rejects.toThrow(/Authentication Token/);
    });

    test('a 401 with a token says the token does not match', async () => {
        sendRequest.mockRejectedValueOnce(httpError(401));

        await expect(
            clayWebhook.sendRow({
                webhookUrl: 'https://api.clay.com/v3/sources/webhook/x',
                authToken: 'wrong',
                row: {},
            }),
        ).rejects.toThrow(/does not match/);
    });

    test('a 404 points at the source rather than the token', async () => {
        sendRequest.mockRejectedValueOnce(httpError(404));

        await expect(
            clayWebhook.sendRow({
                webhookUrl: 'https://api.clay.com/v3/sources/webhook/x',
                row: {},
            }),
        ).rejects.toThrow(/404/);
    });

    test('an unrecognised failure still surfaces Clay\'s own message', async () => {
        sendRequest.mockRejectedValueOnce(httpError(500));

        await expect(
            clayWebhook.sendRow({
                webhookUrl: 'https://api.clay.com/v3/sources/webhook/x',
                row: {},
            }),
        ).rejects.toThrow(/500/);
    });
});
