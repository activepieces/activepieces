import { HttpError } from '@activepieces/pieces-common';
import { AppConnectionType, createMockActionContext, InputPropertyMap, PropertyContext } from '@activepieces/pieces-framework';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const sendRequest = vi.fn();
const mockContext = createMockActionContext<InputPropertyMap>({ propsValue: {} });

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
    return {
        ...actual,
        httpClient: {
            sendRequest: (...args: unknown[]) => sendRequest(...args),
        },
    };
});

let piece: typeof import('../src/index');
let props: typeof import('../src/lib/common/props');

beforeAll(async () => {
    piece = await import('../src/index');
    props = await import('../src/lib/common/props');
});

beforeEach(() => {
    sendRequest.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('ConnectUC dropdowns', () => {
    it('lists domains from a successful response', async () => {
        respond({ acme: { domain: 'acme.example', reseller: 'r1', description: 'Acme' } });
        const result = await props.domainProp().options({ auth: oauthAuth() }, propertyContext());
        expect(result).toEqual({ disabled: false, options: [{ label: 'Acme (acme.example)', value: 'acme.example' }] });
    });

    it('shows the upstream status and message when the API rejects the token', async () => {
        fail(new HttpError(undefined, { status: 401, responseBody: { message: 'Unauthenticated.' } }));
        const result = await props.domainProp().options({ auth: oauthAuth() }, propertyContext());
        expect(result).toEqual({ disabled: true, placeholder: 'Error loading domains (401: Unauthenticated.)', options: [] });
    });

    it('shows only the status when the error body has no message', async () => {
        fail(new HttpError(undefined, { status: 500, responseBody: '<html>Server Error</html>' }));
        const result = await props.domainProp().options({ auth: oauthAuth() }, propertyContext());
        expect(result).toEqual({ disabled: true, placeholder: 'Error loading domains (500)', options: [] });
    });

    it('shows the error message for a network failure', async () => {
        fail(new Error('getaddrinfo ENOTFOUND api.connectuc.io'));
        const result = await props.domainProp().options({ auth: oauthAuth() }, propertyContext());
        expect(result).toEqual({ disabled: true, placeholder: 'Error loading domains (getaddrinfo ENOTFOUND api.connectuc.io)', options: [] });
    });

    it('shows the upstream status in the SMS number dropdown too', async () => {
        fail(new HttpError(undefined, { status: 403, responseBody: { message: 'This action is unauthorized.' } }));
        const result = await props.smsNumberProp().options({ auth: oauthAuth() }, propertyContext());
        expect(result).toEqual({ disabled: true, placeholder: 'Error loading SMS numbers (403: This action is unauthorized.)', options: [] });
    });
});

describe('ConnectUC connection validation', () => {
    it('accepts a token that both the sign-in server and the API accept', async () => {
        respond({ sub: 'user-1' });
        respond({});
        expect(await validate()).toEqual({ valid: true });
        expect(sendRequest.mock.calls[1][0].url).toBe('https://api.connectuc.io/activepieces/domains');
    });

    it('rejects a token the API refuses with 401 even though sign-in accepted it', async () => {
        respond({ sub: 'user-1' });
        fail(new HttpError(undefined, { status: 401, responseBody: { message: 'Unauthenticated.' } }));
        const result = await validate();
        expect(result.valid).toBe(false);
        expect(result.valid === false && result.error).toContain('401: Unauthenticated.');
    });

    it('still accepts the token when the API check fails for another reason', async () => {
        respond({ sub: 'user-1' });
        fail(new HttpError(undefined, { status: 503, responseBody: { message: 'Service Unavailable' } }));
        expect(await validate()).toEqual({ valid: true });
    });

    it('rejects a token the sign-in server refuses', async () => {
        fail(new HttpError(undefined, { status: 401, responseBody: { error: 'invalid_token' } }));
        expect(await validate()).toEqual({ valid: false, error: 'Invalid or expired access token. Please reconnect your ConnectUC account.' });
        expect(sendRequest).toHaveBeenCalledTimes(1);
    });
});

function respond(body: unknown): void {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function fail(error: Error): void {
    sendRequest.mockRejectedValueOnce(error);
}

function validate() {
    const { apiUrl, publicUrl } = mockContext.server;
    const check = piece.connectucAuth.validate;
    if (!check) {
        throw new Error('connectucAuth.validate is not defined');
    }
    return check({ auth: oauthAuth(), server: { apiUrl, publicUrl, mintOidcToken: async () => 'test-oidc-token' } });
}

function propertyContext(): PropertyContext {
    const { server, project, flows, connections } = mockContext;
    return { server, project, flows, connections };
}

function oauthAuth() {
    return {
        type: AppConnectionType.OAUTH2 as const,
        access_token: 'token',
        client_id: 'client',
        client_secret: 'secret',
        redirect_url: 'https://example.com/redirect',
        token_type: 'Bearer',
        claimed_at: 0,
        refresh_token: 'refresh',
        scope: 'offline_access',
        token_url: 'https://auth.uc-technologies.com/oauth2/token',
        data: {},
    };
}
