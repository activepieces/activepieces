/// <reference types="vitest/globals" />

import { HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import { verifyEmail } from '../src/lib/actions/verify-email';

const AUTH = { type: 'SECRET_TEXT', secret_text: 'test-api-key' };

afterEach(() => {
    vi.restoreAllMocks();
});

describe('verify email', () => {
    test('calls the api.millionverifier.com host so the response is JSON, not the marketing site', async () => {
        const requests: HttpRequest[] = [];
        vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest): Promise<HttpResponse> => {
            requests.push(request);
            return { status: 200, headers: {}, body: { email: 'jane@example.com', result: 'ok' } };
        });

        const output = await verifyEmail.run({
            auth: AUTH,
            propsValue: { email: 'jane@example.com', timeout: 5 },
        } as never);

        const url = new URL(requests[0].url);
        expect(url.origin).toBe('https://api.millionverifier.com');
        expect(url.pathname).toBe('/api/v3/');
        expect(Object.fromEntries(url.searchParams)).toEqual({
            api: 'test-api-key',
            email: 'jane@example.com',
            timeout: '5',
        });
        expect(output).toEqual({ email: 'jane@example.com', result: 'ok' });
    });
});
