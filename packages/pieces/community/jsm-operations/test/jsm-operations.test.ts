import { HttpError, httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
    AppConnectionType,
    AppConnectionValueForAuthProperty,
    createMockActionContext,
    createMockPollingTriggerContext,
    InputPropertyMap,
    OutputSchema,
    PropertyContext,
    StaticPropsValue,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { acknowledgeAlertAction } from '../src/lib/actions/acknowledge-alert';
import { addNoteAction } from '../src/lib/actions/add-note';
import { addTagsAction } from '../src/lib/actions/add-tags';
import { assignAlertAction } from '../src/lib/actions/assign-alert';
import { closeAlertAction } from '../src/lib/actions/close-alert';
import { createAlertAction } from '../src/lib/actions/create-alert';
import { findAlertsAction } from '../src/lib/actions/find-alerts';
import { getAlertAction } from '../src/lib/actions/get-alert';
import { getOnCallAction } from '../src/lib/actions/get-on-call';
import { removeTagsAction } from '../src/lib/actions/remove-tags';
import { updateAlertAction } from '../src/lib/actions/update-alert';
import { jsmAccountAuth, jsmKeyAuth, jsmOpsAuth } from '../src/lib/auth';
import { jsmOps, KEY_HOSTS } from '../src/lib/common/client';
import { jsmOpsProps } from '../src/lib/common/props';
import { jsmOperations } from '../src';
import { newAlertTrigger } from '../src/lib/triggers/new-alert';

const sendRequest = vi.fn();

const CLOUD_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const FAKE_ALERT_KEY = 'fake-alert-key';
const ACCOUNT_BASE = `https://api.atlassian.com/jsm/ops/api/${CLOUD_ID}/v1`;
const SITE = 'https://acme.atlassian.net';

const ACCOUNT_AUTH: JsmConnection = {
    type: AppConnectionType.CUSTOM_AUTH,
    props: { siteUrl: 'acme.atlassian.net', email: 'ops@acme.com', apiToken: 'tok', cloudId: CLOUD_ID },
};

const ACCOUNT_AUTH_NO_CLOUD_ID: JsmConnection = {
    type: AppConnectionType.CUSTOM_AUTH,
    props: { siteUrl: 'https://acme.atlassian.net/', email: 'ops@acme.com', apiToken: 'tok', cloudId: undefined },
};

function keyAuth(host: string): JsmConnection {
    return { type: AppConnectionType.BASIC_AUTH, username: host, password: FAKE_ALERT_KEY };
}

const API_ALERT = {
    id: 'alert-1',
    tinyId: '42',
    createdAt: '2026-09-28T08:15:00.000Z',
    updatedAt: '2026-09-28T08:16:00.000Z',
    message: 'CPU high',
    entity: 'web-01',
    source: 'Monitor',
    status: 'open',
    alias: 'web-01-cpu',
    tags: ['prod', 'cpu'],
    extraProperties: { region: 'eu' },
    description: 'CPU above 90%',
    acknowledged: false,
    count: 3,
    owner: '',
    snoozed: false,
    lastOccuredAt: '2026-09-28T08:15:30.000Z',
    integrationType: 'API',
    integrationName: 'Default API',
    priority: 'P2',
    responders: [{ id: 'team-1', type: 'team' }],
    actions: ['Restart'],
    seen: true,
};

function mockApi(handler: Handler) {
    sendRequest.mockImplementation(async (request: Request) => {
        if (request.url === `${SITE}/_edge/tenant_info`) {
            return { status: 200, body: { cloudId: CLOUD_ID } };
        }
        const reply = handler(request);
        if (reply === undefined) {
            throw new Error(`Unexpected request ${request.method} ${request.url}`);
        }
        if (reply.status >= 400) {
            throw new HttpError(request.body, { status: reply.status, responseBody: reply.body });
        }
        return { status: reply.status, body: reply.body };
    });
}

function requests(): Request[] {
    return sendRequest.mock.calls.map((call) => call[0]);
}

function findRequest({ method, url }: { method: string; url: string }): Request {
    const found = requests().find((request) => request.method === method && request.url === url);
    if (found === undefined) {
        throw new Error(`no ${method} ${url} request`);
    }
    return found;
}

function accepted(requestId: string): Reply {
    return { status: 202, body: { result: 'Request will be processed', requestId, took: 0.01 } };
}

function processed({ requestId, alertId, success, status }: ProcessedParams): Reply {
    return {
        status: 200,
        body: {
            action: 'Create',
            processedAt: '2026-09-28T08:15:01.000Z',
            isSuccess: success,
            status,
            alertId,
            alias: 'web-01-cpu',
            requestId,
        },
    };
}

function makeContext<Props extends InputPropertyMap>({ propsValue, auth }: { propsValue: StaticPropsValue<Props>; auth: JsmConnection }) {
    return { ...createMockActionContext<Props>({ propsValue }), auth };
}

function makeTriggerContext<Props extends InputPropertyMap>({ propsValue, auth, store }: TriggerContextParams<Props>) {
    const { files } = createMockActionContext<Props>({ propsValue });
    return { ...createMockPollingTriggerContext<Props>({ propsValue }), auth, store, files };
}

function memoryStore(initial: Record<string, unknown> = {}) {
    const data = new Map<string, unknown>(Object.entries(initial));
    return {
        data,
        put: async <T>(key: string, value: T): Promise<T> => {
            data.set(key, value);
            return value;
        },
        get: async <T>(key: string): Promise<T | null> => {
            const value = data.get(key);
            return value === undefined ? null : readAs<T>(value);
        },
        delete: async (key: string): Promise<void> => {
            data.delete(key);
        },
    };
}

function readAs<T>(value: unknown): T {
    return JSON.parse(JSON.stringify(value));
}

function propertyContext(searchValue?: string): PropertyContext {
    const { server, project, flows, connections } = createMockActionContext({ propsValue: {} });
    return { server, project, flows, connections, searchValue };
}

async function settle<T>(promise: Promise<T>): Promise<T> {
    const guarded: Promise<Settled<T>> = promise.then(
        (value): Settled<T> => ({ ok: true, value }),
        (error: unknown): Settled<T> => ({ ok: false, error }),
    );
    await vi.runAllTimersAsync();
    const result = await guarded;
    if (!result.ok) {
        throw result.error;
    }
    return result.value;
}

async function settleError(promise: Promise<unknown>): Promise<string> {
    try {
        await settle(promise);
    } catch (error) {
        return error instanceof Error ? error.message : String(error);
    }
    throw new Error('expected the promise to reject');
}

function fieldKeys(fields: OutputSchema['fields'] | undefined): string[] {
    return (fields ?? []).map((field) => field.key).sort();
}

function objectKeys(value: unknown): string[] {
    if (value === null || typeof value !== 'object') {
        throw new Error('expected an object');
    }
    return Object.keys(value).sort();
}

function firstItem(value: unknown): unknown {
    if (!Array.isArray(value) || value.length === 0) {
        throw new Error('expected a non-empty list');
    }
    return value[0];
}

function validate({ auth, props }: { auth: typeof jsmAccountAuth | typeof jsmKeyAuth; props: Record<string, string> }) {
    const server = { apiUrl: 'http://localhost:3000', publicUrl: 'http://localhost:4200', mintOidcToken: async () => 'oidc' };
    if (auth === jsmKeyAuth) {
        return jsmKeyAuth.validate?.({ auth: { username: props['host'] ?? '', password: props['apiKey'] ?? '' }, server });
    }
    return jsmAccountAuth.validate?.({
        auth: {
            siteUrl: props['siteUrl'] ?? '',
            email: props['email'] ?? '',
            apiToken: props['apiToken'] ?? '',
            cloudId: props['cloudId'],
        },
        server,
    });
}

function pollingTrigger() {
    const trigger = newAlertTrigger;
    if (trigger.type !== TriggerStrategy.POLLING) {
        throw new Error('expected a polling trigger');
    }
    return trigger;
}

function participantAt({ result, index }: { result: unknown; index: number }): unknown {
    if (result === null || typeof result !== 'object' || !('participants' in result) || !Array.isArray(result.participants)) {
        throw new Error('expected participants');
    }
    return result.participants[index];
}

beforeEach(() => {
    sendRequest.mockReset();
    vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => sendRequest(request));
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('piece definition', () => {
    it('loads with one auth per connection type and every action and trigger', () => {
        expect(jsmOperations.displayName).toBe('Jira Service Management Operations');
        expect(jsmOperations.description.startsWith('Opsgenie')).toBe(true);
        expect(Object.keys(jsmOperations.actions())).toHaveLength(16);
        expect(Object.keys(jsmOperations.triggers())).toEqual(['new_alert']);
        expect(Object.values(jsmOperations.actions()).filter((action) => action.name !== 'custom_api_call').every((action) => action.outputSchema !== undefined && action.audience === 'both')).toBe(true);
    });
});

describe('list inputs', () => {
    it('accepts arrays, JSON strings and comma-separated text', () => {
        expect(jsmOps.parseStringList(['a', ' b ', '', 3])).toEqual(['a', 'b', '3']);
        expect(jsmOps.parseStringList('["prod","cpu"]')).toEqual(['prod', 'cpu']);
        expect(jsmOps.parseStringList('prod, cpu')).toEqual(['prod', 'cpu']);
        expect(jsmOps.parseStringList(undefined)).toEqual([]);
    });
});

describe('connection routing', () => {
    it('tells the two connection types apart by connection type', () => {
        expect(jsmOps.isKeyConnection(keyAuth(KEY_HOSTS.opsgenieEu))).toBe(true);
        expect(jsmOps.isKeyConnection(keyAuth('eu'))).toBe(true);
        expect(jsmOps.isKeyConnection(ACCOUNT_AUTH)).toBe(false);
        expect(jsmOpsAuth).toEqual([jsmAccountAuth, jsmKeyAuth]);
    });

    it('uses basic auth against the cloud-scoped JSM Operations API for account connections', async () => {
        const route = await jsmOps.routeFor(ACCOUNT_AUTH);
        const expected = `Basic ${Buffer.from('ops@acme.com:tok').toString('base64')}`;
        expect(route).toEqual({ kind: 'account', baseUrl: ACCOUNT_BASE, siteUrl: SITE, headers: { Authorization: expected } });
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('looks the Cloud ID up from the site when it is empty, without following redirects', async () => {
        mockApi(() => undefined);

        const route = await jsmOps.routeFor(ACCOUNT_AUTH_NO_CLOUD_ID);

        expect(route.baseUrl).toBe(ACCOUNT_BASE);
        const lookup = findRequest({ method: 'GET', url: `${SITE}/_edge/tenant_info` });
        expect(lookup.followRedirects).toBe(false);
        expect(lookup.timeout).toBeGreaterThan(0);
    });

    it('rejects site URLs that are not https Atlassian Cloud hosts', () => {
        expect(jsmOps.normalizeSiteUrl('https://acme.atlassian.net/jira/')).toBe(SITE);
        expect(() => jsmOps.normalizeSiteUrl('http://acme.atlassian.net')).toThrow(/not an Atlassian Cloud site/);
        expect(() => jsmOps.normalizeSiteUrl('https://evil.example.com')).toThrow(/not an Atlassian Cloud site/);
        expect(() => jsmOps.normalizeSiteUrl('https://atlassian.net.evil.com')).toThrow(/not an Atlassian Cloud site/);
        expect(() => jsmOps.normalizeSiteUrl('https://acme.atlassian.net:8443')).toThrow(/not an Atlassian Cloud site/);
    });

    it('fails clearly when the site returns no Cloud ID', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: { cloudId: '' } });

        await expect(jsmOps.routeFor(ACCOUNT_AUTH_NO_CLOUD_ID)).rejects.toThrow(/did not return a Cloud ID/);
    });

    it.each([
        [KEY_HOSTS.jsm, 'https://api.atlassian.com/jsm/ops/integration/v2'],
        [KEY_HOSTS.opsgenieUs, 'https://api.opsgenie.com/v2'],
        [KEY_HOSTS.opsgenieEu, 'https://api.eu.opsgenie.com/v2'],
    ])('sends GenieKey auth to the %s alert API', async (host, baseUrl) => {
        const route = await jsmOps.routeFor(keyAuth(host));
        expect(route).toEqual({ kind: 'key', baseUrl, headers: { Authorization: `GenieKey ${FAKE_ALERT_KEY}` } });
    });

    it.each([
        ['jsm', KEY_HOSTS.jsm],
        [' US ', KEY_HOSTS.opsgenieUs],
        ['eu', KEY_HOSTS.opsgenieEu],
        ['api.eu.opsgenie.com/', KEY_HOSTS.opsgenieEu],
        ['https://api.atlassian.com/jsm/ops/integration', KEY_HOSTS.jsm],
    ])('accepts %s as the API host', (value, host) => {
        expect(jsmOps.resolveKeyHost(value)).toBe(host);
    });

    it('refuses API hosts outside the allowed list', async () => {
        await expect(jsmOps.routeFor(keyAuth('https://attacker.example.com'))).rejects.toThrow(/Unknown API host/);
        await expect(jsmOps.routeFor(keyAuth('http://api.opsgenie.com'))).rejects.toThrow(/Unknown API host/);
    });
});

describe('connection validation', () => {
    it('accepts an account that can list alerts', async () => {
        mockApi((request) => (request.url === `${ACCOUNT_BASE}/alerts` ? { status: 200, body: { values: [] } } : undefined));

        await expect(
            validate({ auth: jsmAccountAuth, props: { siteUrl: SITE, email: 'ops@acme.com', apiToken: 'tok', cloudId: CLOUD_ID } }),
        ).resolves.toEqual({ valid: true });
        expect(findRequest({ method: 'GET', url: `${ACCOUNT_BASE}/alerts` }).queryParams).toEqual({ size: '1' });
    });

    it('reports the vendor message when the account is rejected', async () => {
        mockApi(() => ({ status: 401, body: { code: 401, message: 'Unauthorized' } }));

        const result = await validate({ auth: jsmAccountAuth, props: { siteUrl: SITE, email: 'ops@acme.com', apiToken: 'bad', cloudId: CLOUD_ID } });

        expect(result).toEqual({ valid: false, error: expect.stringContaining('HTTP 401): Unauthorized') });
    });

    it('accepts an API key when an unknown request ID gives 404 and rejects it on 401', async () => {
        mockApi(() => ({ status: 404, body: { message: 'Request not found' } }));
        await expect(validate({ auth: jsmKeyAuth, props: { host: KEY_HOSTS.jsm, apiKey: 'good' } })).resolves.toEqual({ valid: true });

        mockApi(() => ({ status: 401, body: { message: 'Could not authenticate' } }));
        const result = await validate({ auth: jsmKeyAuth, props: { host: KEY_HOSTS.opsgenieUs, apiKey: 'bad' } });
        expect(result).toEqual({ valid: false, error: expect.stringContaining('Could not authenticate') });
    });
});

describe('Create Alert', () => {
    const defaults = {
        description: undefined,
        priority: 'P3',
        alias: undefined,
        responderTeams: undefined,
        responderUsers: undefined,
        responderSchedules: undefined,
        responderEscalations: undefined,
        responderNames: undefined,
        tags: undefined,
        entity: undefined,
        source: undefined,
        note: undefined,
        extraProperties: undefined,
        actions: undefined,
        user: undefined,
    };

    function runCreate({ auth, propsValue }: { auth: JsmConnection; propsValue: Partial<StaticPropsValue<typeof createAlertAction.props>> }) {
        return createAlertAction.run(
            makeContext<typeof createAlertAction.props>({ auth, propsValue: { message: 'CPU high', ...defaults, ...propsValue } }),
        );
    }

    it('posts the account-route body and returns the processed alert ID', async () => {
        mockApi((request) => {
            if (request.method === 'POST' && request.url === `${ACCOUNT_BASE}/alerts`) {
                return accepted('req-1');
            }
            if (request.url === `${ACCOUNT_BASE}/alerts/requests/req-1`) {
                return processed({ requestId: 'req-1', alertId: 'alert-1', success: true, status: 'Created alert' });
            }
            return undefined;
        });

        const result = await settle(
            runCreate({
                auth: ACCOUNT_AUTH,
                propsValue: {
                    alias: ' web-01-cpu ',
                    priority: 'P1',
                    responderTeams: ['team-1'],
                    responderUsers: ['acc-1'],
                    tags: ['prod', ' ', 'cpu'],
                    extraProperties: { region: 'eu', attempts: 3 },
                    user: 'ignored-on-account-route',
                },
            }),
        );

        expect(findRequest({ method: 'POST', url: `${ACCOUNT_BASE}/alerts` }).body).toEqual({
            message: 'CPU high',
            alias: 'web-01-cpu',
            priority: 'P1',
            responders: [
                { id: 'team-1', type: 'team' },
                { id: 'acc-1', type: 'user' },
            ],
            tags: ['prod', 'cpu'],
            extraProperties: { region: 'eu', attempts: '3' },
        });
        expect(result).toEqual({
            request_id: 'req-1',
            processed: true,
            success: true,
            action: 'Create',
            status: 'Created alert',
            alert_id: 'alert-1',
            alias: 'web-01-cpu',
            processed_at: '2026-09-28T08:15:01.000Z',
        });
    });

    it('uses the Opsgenie shape on API key connections: details, user and names', async () => {
        mockApi((request) => {
            if (request.method === 'POST' && request.url === 'https://api.eu.opsgenie.com/v2/alerts') {
                return accepted('req-2');
            }
            if (request.url === 'https://api.eu.opsgenie.com/v2/alerts/requests/req-2') {
                return { status: 200, body: { data: { success: true, action: 'Create', alertId: 'og-1', status: 'Created alert' }, took: 0.1 } };
            }
            return undefined;
        });

        const result = await settle(
            runCreate({
                auth: keyAuth(KEY_HOSTS.opsgenieEu),
                propsValue: {
                    responderNames: [
                        { type: 'team', name: 'Ops' },
                        { type: 'user', name: 'jane@acme.com' },
                    ],
                    extraProperties: { region: 'eu' },
                    user: 'Activepieces',
                },
            }),
        );

        const create = findRequest({ method: 'POST', url: 'https://api.eu.opsgenie.com/v2/alerts' });
        expect(create.headers?.['Authorization']).toBe(`GenieKey ${FAKE_ALERT_KEY}`);
        expect(create.body).toEqual({
            message: 'CPU high',
            priority: 'P3',
            user: 'Activepieces',
            responders: [
                { name: 'Ops', type: 'team' },
                { username: 'jane@acme.com', type: 'user' },
            ],
            details: { region: 'eu' },
        });
        expect(result).toMatchObject({ alert_id: 'og-1', processed: true, success: true });
    });

    it('keeps polling while the request is not processed yet, then returns processed false', async () => {
        mockApi((request) => {
            if (request.method === 'POST') {
                return accepted('req-3');
            }
            return { status: 404, body: { message: 'Request not found. It might not be processed, yet.' } };
        });

        const result = await settle(runCreate({ auth: keyAuth(KEY_HOSTS.jsm), propsValue: {} }));

        const polls = requests().filter((request) => request.url.endsWith('/alerts/requests/req-3'));
        expect(polls).toHaveLength(5);
        expect(polls.every((request) => request.timeout !== undefined && request.timeout <= 5_000)).toBe(true);
        expect(result).toMatchObject({ request_id: 'req-3', processed: false, success: null, alert_id: null });
    });

    it('stays within about 30 seconds of polling', () => {
        const waits = [500, 1_000, 2_000, 3_000, 4_000].reduce((total, delay) => total + delay, 0);
        expect(waits + 5 * 4_000).toBeLessThanOrEqual(30_500);
    });

    it('fails with the vendor status when processing failed', async () => {
        mockApi((request) => {
            if (request.method === 'POST') {
                return accepted('req-4');
            }
            return processed({ requestId: 'req-4', alertId: '', success: false, status: 'Responder team does not exist' });
        });

        const message = await settleError(runCreate({ auth: ACCOUNT_AUTH, propsValue: {} }));

        expect(message).toBe('JSM Operations could not create the alert: Responder team does not exist.');
    });

    it('explains plan-limited actions instead of showing only the raw vendor text', async () => {
        mockApi((request) => {
            if (request.method === 'POST') {
                return accepted('req-plan');
            }
            return processed({
                requestId: 'req-plan',
                alertId: '',
                success: false,
                status: 'Your account plan does not support alert assign action..',
            });
        });

        const message = await settleError(runCreate({ auth: ACCOUNT_AUTH, propsValue: {} }));

        expect(message).toContain('Your account plan does not support alert assign action.');
        expect(message).not.toContain('action...');
        expect(message).toContain('not included in your Jira Service Management plan');
    });

    it('surfaces validation errors from the API', async () => {
        mockApi(() => ({ status: 422, body: { errors: [{ title: 'message should not exceed 130 characters', code: 'x' }] } }));

        const message = await settleError(runCreate({ auth: ACCOUNT_AUTH, propsValue: {} }));

        expect(message).toContain('HTTP 422): message should not exceed 130 characters');
    });

    it('rejects name-based responders on account connections', async () => {
        const message = await settleError(
            runCreate({ auth: ACCOUNT_AUTH, propsValue: { responderNames: [{ type: 'team', name: 'Ops' }] } }),
        );

        expect(message).toMatch(/only work with API key connections/);
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

describe('key-route alert actions', () => {
    it('acknowledges by alias with identifierType on the API key route', async () => {
        mockApi((request) => {
            if (request.method === 'POST') {
                return accepted('req-a');
            }
            return { status: 200, body: { data: { success: true, action: 'Acknowledge', alertId: 'og-9', status: 'Acknowledged' } } };
        });

        const result = await settle(
            acknowledgeAlertAction.run(
                makeContext<typeof acknowledgeAlertAction.props>({
                    auth: keyAuth(KEY_HOSTS.jsm),
                    propsValue: { alert: 'web-01-cpu', identifierType: 'alias', note: 'On it', user: 'Bot', source: undefined },
                }),
            ),
        );

        const ack = findRequest({ method: 'POST', url: 'https://api.atlassian.com/jsm/ops/integration/v2/alerts/web-01-cpu/acknowledge' });
        expect(ack.queryParams).toEqual({ identifierType: 'alias' });
        expect(ack.body).toEqual({ note: 'On it', user: 'Bot' });
        expect(ack.headers?.['Authorization']).toBe(`GenieKey ${FAKE_ALERT_KEY}`);
        expect(result).toMatchObject({ processed: true, success: true, alert_id: 'og-9', note_added: true, note_error: null });
    });

    it('closes on the account route by resolving the alias, then adds the note', async () => {
        mockApi((request) => {
            if (request.url === `${ACCOUNT_BASE}/alerts/alias`) {
                return { status: 200, body: API_ALERT };
            }
            if (request.url === `${ACCOUNT_BASE}/alerts/alert-1/close`) {
                return accepted('req-c');
            }
            if (request.url === `${ACCOUNT_BASE}/alerts/requests/req-c`) {
                return processed({ requestId: 'req-c', alertId: 'alert-1', success: true, status: 'Closed' });
            }
            if (request.url === `${ACCOUNT_BASE}/alerts/alert-1/notes`) {
                return { status: 200, body: { id: 'note-1', note: 'Fixed' } };
            }
            return undefined;
        });

        const result = await settle(
            closeAlertAction.run(
                makeContext<typeof closeAlertAction.props>({
                    auth: ACCOUNT_AUTH,
                    propsValue: { alert: 'web-01-cpu', identifierType: 'alias', note: 'Fixed', user: undefined, source: undefined },
                }),
            ),
        );

        expect(findRequest({ method: 'GET', url: `${ACCOUNT_BASE}/alerts/alias` }).queryParams).toEqual({ alias: 'web-01-cpu' });
        expect(findRequest({ method: 'POST', url: `${ACCOUNT_BASE}/alerts/alert-1/close` }).body).toBeUndefined();
        expect(findRequest({ method: 'POST', url: `${ACCOUNT_BASE}/alerts/alert-1/notes` }).body).toEqual({ note: 'Fixed' });
        expect(result).toMatchObject({ alert_id: 'alert-1', success: true, note_added: true, note_error: null });
        expect(objectKeys(result)).toEqual(fieldKeys(closeAlertAction.outputSchema?.fields));
    });

    it('still reports the close when the follow-up note fails, instead of failing the step', async () => {
        mockApi((request) => {
            if (request.url === `${ACCOUNT_BASE}/alerts/alert-1/close`) {
                return accepted('req-c');
            }
            if (request.url === `${ACCOUNT_BASE}/alerts/requests/req-c`) {
                return processed({ requestId: 'req-c', alertId: 'alert-1', success: true, status: 'Closed' });
            }
            if (request.url === `${ACCOUNT_BASE}/alerts/alert-1/notes`) {
                return { status: 500, body: { message: 'Internal error' } };
            }
            return undefined;
        });

        const result = await settle(
            closeAlertAction.run(
                makeContext<typeof closeAlertAction.props>({
                    auth: ACCOUNT_AUTH,
                    propsValue: { alert: 'alert-1', identifierType: 'id', note: 'Fixed', user: undefined, source: undefined },
                }),
            ),
        );

        expect(result).toMatchObject({ alert_id: 'alert-1', success: true, note_added: false });
        expect(result).toHaveProperty('note_error', expect.stringContaining('The alert was updated, but the note could not be added'));
    });

    it('leaves the note fields empty when no note is given', async () => {
        mockApi((request) => {
            if (request.url === `${ACCOUNT_BASE}/alerts/alert-1/acknowledge`) {
                return accepted('req-a');
            }
            if (request.url === `${ACCOUNT_BASE}/alerts/requests/req-a`) {
                return processed({ requestId: 'req-a', alertId: 'alert-1', success: true, status: 'Acknowledged' });
            }
            return undefined;
        });

        const result = await settle(
            acknowledgeAlertAction.run(
                makeContext<typeof acknowledgeAlertAction.props>({
                    auth: ACCOUNT_AUTH,
                    propsValue: { alert: 'alert-1', identifierType: 'id', note: undefined, user: undefined, source: undefined },
                }),
            ),
        );

        expect(result).toMatchObject({ success: true, note_added: null, note_error: null });
        expect(requests().some((request) => request.url.endsWith('/notes'))).toBe(false);
    });

    it('adds a note synchronously on the account route and asynchronously with a key', async () => {
        mockApi((request) => {
            if (request.url === `${ACCOUNT_BASE}/alerts/alert-1/notes`) {
                return { status: 200, body: { id: 'note-1', note: 'Checked logs', createdAt: '2026-09-28T09:00:00Z' } };
            }
            if (request.url === 'https://api.opsgenie.com/v2/alerts/alert-1/notes') {
                return accepted('req-n');
            }
            if (request.url === 'https://api.opsgenie.com/v2/alerts/requests/req-n') {
                return { status: 200, body: { data: { success: true, action: 'AddNote', alertId: 'alert-1' } } };
            }
            return undefined;
        });
        const propsValue = { alert: 'alert-1', identifierType: 'id', note: 'Checked logs', user: undefined, source: undefined };

        const account = await settle(
            addNoteAction.run(makeContext<typeof addNoteAction.props>({ auth: ACCOUNT_AUTH, propsValue })),
        );
        const key = await settle(
            addNoteAction.run(makeContext<typeof addNoteAction.props>({ auth: keyAuth(KEY_HOSTS.opsgenieUs), propsValue })),
        );

        expect(account).toMatchObject({ note_id: 'note-1', request_id: null, processed: true, alert_id: 'alert-1' });
        expect(key).toMatchObject({ note_id: null, request_id: 'req-n', processed: true, alert_id: 'alert-1' });
        expect(findRequest({ method: 'POST', url: 'https://api.opsgenie.com/v2/alerts/alert-1/notes' }).queryParams).toEqual({ identifierType: 'id' });
        expect(objectKeys(account)).toEqual(fieldKeys(addNoteAction.outputSchema?.fields));
        expect(objectKeys(key)).toEqual(fieldKeys(addNoteAction.outputSchema?.fields));
    });
});

describe('account-only actions', () => {
    it.each([
        ['Get Alert', () => getAlertAction.run(makeContext<typeof getAlertAction.props>({ auth: keyAuth(KEY_HOSTS.jsm), propsValue: { alert: 'a', identifierType: 'id' } }))],
        [
            'Find Alerts',
            () =>
                findAlertsAction.run(
                    makeContext<typeof findAlertsAction.props>({
                        auth: keyAuth(KEY_HOSTS.opsgenieUs),
                        propsValue: { query: undefined, sort: undefined, order: undefined, limit: undefined, offset: undefined },
                    }),
                ),
        ],
        [
            'Add Tags to Alert',
            () => addTagsAction.run(makeContext<typeof addTagsAction.props>({ auth: keyAuth(KEY_HOSTS.jsm), propsValue: { alert: 'a', identifierType: 'id', tags: ['x'] } })),
        ],
        [
            'Get Who Is On Call',
            () => getOnCallAction.run(makeContext<typeof getOnCallAction.props>({ auth: keyAuth(KEY_HOSTS.jsm), propsValue: { scheduleId: 's', date: undefined } })),
        ],
    ])('%s refuses an API key connection with a clear message', async (feature, run) => {
        const message = await settleError(run());

        expect(message).toContain(`${feature} needs an Atlassian account connection`);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('gets an alert by alias and flattens it to the output schema keys', async () => {
        mockApi((request) => (request.url === `${ACCOUNT_BASE}/alerts/alias` ? { status: 200, body: API_ALERT } : undefined));

        const result = await getAlertAction.run(
            makeContext<typeof getAlertAction.props>({ auth: ACCOUNT_AUTH, propsValue: { alert: 'web-01-cpu', identifierType: 'alias' } }),
        );

        expect(result).toMatchObject({
            id: 'alert-1',
            tags: 'prod, cpu',
            responders: 'team:team-1',
            owner: null,
            last_occurred_at: '2026-09-28T08:15:30.000Z',
            extra_properties: { region: 'eu' },
        });
        expect(objectKeys(result)).toEqual(fieldKeys(getAlertAction.outputSchema?.fields));
    });

    it('builds the Find Alerts query and clamps the page size', async () => {
        mockApi((request) => (request.url === `${ACCOUNT_BASE}/alerts` ? { status: 200, body: { values: [API_ALERT], count: 1 } } : undefined));

        const result = await findAlertsAction.run(
            makeContext<typeof findAlertsAction.props>({
                auth: ACCOUNT_AUTH,
                propsValue: { query: ' status: open ', sort: 'priority', order: 'asc', limit: 500, offset: 20 },
            }),
        );

        expect(findRequest({ method: 'GET', url: `${ACCOUNT_BASE}/alerts` }).queryParams).toEqual({
            query: 'status: open',
            sort: 'priority',
            order: 'asc',
            size: '100',
            offset: '20',
        });
        const schema = findAlertsAction.outputSchema;
        expect(schema?.fields[0].value).toBe('');
        expect(objectKeys(firstItem(result))).toEqual(fieldKeys(schema?.fields[0].listItems));
    });

    it('omits an empty query and falls back to safe defaults', async () => {
        mockApi(() => ({ status: 200, body: { values: [] } }));

        await findAlertsAction.run(
            makeContext<typeof findAlertsAction.props>({
                auth: ACCOUNT_AUTH,
                propsValue: { query: '  ', sort: 'bogus', order: undefined, limit: 0, offset: -5 },
            }),
        );

        expect(requests()[0].queryParams).toEqual({ sort: 'createdAt', order: 'desc', size: '1', offset: '0' });
    });

    it('removes tags with a DELETE body and assigns by account ID', async () => {
        mockApi((request) => {
            if (request.url.endsWith('/requests/req-t')) {
                return processed({ requestId: 'req-t', alertId: 'alert-1', success: true, status: 'ok' });
            }
            return accepted('req-t');
        });

        await settle(
            removeTagsAction.run(
                makeContext<typeof removeTagsAction.props>({ auth: ACCOUNT_AUTH, propsValue: { alert: 'alert-1', identifierType: 'id', tags: ['prod', 'cpu'] } }),
            ),
        );
        await settle(
            assignAlertAction.run(
                makeContext<typeof assignAlertAction.props>({ auth: ACCOUNT_AUTH, propsValue: { alert: 'alert-1', identifierType: 'id', accountId: 'acc-7' } }),
            ),
        );

        expect(findRequest({ method: 'DELETE', url: `${ACCOUNT_BASE}/alerts/alert-1/tags` }).body).toEqual({ tags: ['prod', 'cpu'] });
        expect(findRequest({ method: 'POST', url: `${ACCOUNT_BASE}/alerts/alert-1/assign` }).body).toEqual({ accountId: 'acc-7' });
    });

    it('updates only the filled fields with one PATCH each', async () => {
        mockApi((request) => {
            if (request.method === 'PATCH') {
                return accepted(`req-${request.url.split('/').pop()}`);
            }
            const requestId = request.url.split('/').pop() ?? '';
            return processed({ requestId, alertId: 'alert-1', success: true, status: 'Updated' });
        });

        const result = await settle(
            updateAlertAction.run(
                makeContext<typeof updateAlertAction.props>({
                    auth: ACCOUNT_AUTH,
                    propsValue: { alert: 'alert-1', identifierType: 'id', message: 'New msg', description: undefined, priority: 'P1' },
                }),
            ),
        );

        expect(findRequest({ method: 'PATCH', url: `${ACCOUNT_BASE}/alerts/alert-1/message` }).body).toEqual({ message: 'New msg' });
        expect(findRequest({ method: 'PATCH', url: `${ACCOUNT_BASE}/alerts/alert-1/priority` }).body).toEqual({ priority: 'P1' });
        expect(requests().some((request) => request.url.endsWith('/description'))).toBe(false);
        expect(result).toMatchObject({ alert_id: 'alert-1', updated_fields: 'message, priority', processed: true });
        expect(objectKeys(result)).toEqual(fieldKeys(updateAlertAction.outputSchema?.fields));
    });

    it('flattens on-call participants and collects user IDs', async () => {
        mockApi((request) =>
            request.url === `${ACCOUNT_BASE}/schedules/sched-1/on-calls`
                ? {
                      status: 200,
                      body: {
                          onCallParticipants: [
                              { id: 'team-1', type: 'team' },
                              { id: 'acc-1', type: 'user' },
                              { id: 'esc-1', type: 'escalation', onCallParticipants: [{ id: 'acc-2', type: 'user', forwardedFrom: { id: 'acc-3', type: 'user' } }] },
                          ],
                      },
                  }
                : undefined,
        );

        const result = await getOnCallAction.run(
            makeContext<typeof getOnCallAction.props>({ auth: ACCOUNT_AUTH, propsValue: { scheduleId: 'sched-1', date: '2026-09-28T10:00:00Z' } }),
        );

        expect(findRequest({ method: 'GET', url: `${ACCOUNT_BASE}/schedules/sched-1/on-calls` }).queryParams).toEqual({
            flat: 'false',
            date: '2026-09-28T10:00:00.000Z',
        });
        expect(result).toMatchObject({ on_call_user_ids: 'acc-1, acc-2', on_call_user_count: 2 });
        expect(participantAt({ result, index: 3 })).toEqual({
            id: 'acc-2',
            type: 'user',
            name: null,
            parent_id: 'esc-1',
            parent_type: 'escalation',
            forwarded_from_id: 'acc-3',
        });
        expect(objectKeys(result)).toEqual(fieldKeys(getOnCallAction.outputSchema?.fields));
    });
});

describe('classification', () => {
    it('tags Close Alert as destructive because a closed alert cannot be reopened', () => {
        expect(closeAlertAction.classification).toBe('DESTRUCTIVE');
    });
});

describe('Custom API Call', () => {
    const customApiCallAction = jsmOperations.actions()['custom_api_call'];

    const propsValue = {
        url: { url: '/alerts/count' },
        method: HttpMethod.GET,
        headers: {},
        queryParams: {},
        body_type: 'none',
        body: undefined,
        response_is_binary: false,
        failsafe: false,
        timeout: 10,
        followRedirects: false,
    };

    it('is tagged for humans as an arbitrary write', () => {
        expect(customApiCallAction).toMatchObject({ classification: 'WRITE', audience: 'human', aiMetadata: { idempotent: false } });
    });

    it('resolves the Cloud ID before calling a relative path on an account connection', async () => {
        mockApi(() => ({ status: 200, body: { count: 3 } }));

        await customApiCallAction.run(makeContext<typeof customApiCallAction.props>({ auth: ACCOUNT_AUTH_NO_CLOUD_ID, propsValue }));

        const call = requests().find((request) => request.url.includes('/alerts/count'));
        expect(call?.url).toBe(`${ACCOUNT_BASE}/alerts/count`);
        expect(call?.headers?.['Authorization']).toMatch(/^Basic /);
    });

    it('calls the key host with the GenieKey header', async () => {
        mockApi(() => ({ status: 200, body: { data: { count: 3 } } }));

        await customApiCallAction.run(makeContext<typeof customApiCallAction.props>({ auth: keyAuth(KEY_HOSTS.opsgenieUs), propsValue }));

        expect(requests()[0].url).toBe('https://api.opsgenie.com/v2/alerts/count');
        expect(requests()[0].headers?.['Authorization']).toBe(`GenieKey ${FAKE_ALERT_KEY}`);
    });

    it('accepts a full URL under the connection base URL', async () => {
        mockApi(() => ({ status: 200, body: { count: 3 } }));

        await customApiCallAction.run(
            makeContext<typeof customApiCallAction.props>({ auth: ACCOUNT_AUTH, propsValue: { ...propsValue, url: { url: `${ACCOUNT_BASE}/alerts/count` } } }),
        );

        expect(requests()[0].url).toBe(`${ACCOUNT_BASE}/alerts/count`);
    });

    it.each([
        ['another host', 'https://attacker.example/collect'],
        ['a lookalike host', 'https://api.atlassian.com.attacker.example/jsm/ops/api/x/v1/alerts'],
        ['plain http', `http://api.atlassian.com/jsm/ops/api/${CLOUD_ID}/v1/alerts`],
        ['another Atlassian API', 'https://api.atlassian.com/ex/jira/x/rest/api/3/myself'],
        ['another cloud ID', 'https://api.atlassian.com/jsm/ops/api/other-cloud/v1/alerts'],
        ['a path that climbs out of the base', `${ACCOUNT_BASE}/../../other/v1/alerts`],
        ['embedded credentials', `https://user:pass@api.atlassian.com/jsm/ops/api/${CLOUD_ID}/v1/alerts`],
        ['a protocol-relative URL', '//attacker.example/collect'],
    ])('refuses %s without sending the account credentials', async (_label, url) => {
        mockApi(() => ({ status: 200, body: {} }));

        await expect(
            customApiCallAction.run(makeContext<typeof customApiCallAction.props>({ auth: ACCOUNT_AUTH, propsValue: { ...propsValue, url: { url } } })),
        ).rejects.toThrow(/credentials|not a valid URL/);
        expect(requests()).toHaveLength(0);
    });

    it('keeps an API key on the host picked for the connection', async () => {
        mockApi(() => ({ status: 200, body: {} }));

        await expect(
            customApiCallAction.run(
                makeContext<typeof customApiCallAction.props>({ auth: keyAuth(KEY_HOSTS.opsgenieEu), propsValue: { ...propsValue, url: { url: 'https://api.opsgenie.com/v2/alerts' } } }),
            ),
        ).rejects.toThrow(`only sends this connection's credentials to ${KEY_HOSTS.opsgenieEu}/v2`);
        expect(requests()).toHaveLength(0);
    });
});

describe('New Alert trigger', () => {
    const props = { query: 'priority: P1' };

    it('polls oldest-first for alerts created after the last poll and returns only new ones', async () => {
        mockApi((request) =>
            request.url === `${ACCOUNT_BASE}/alerts`
                ? {
                      status: 200,
                      body: {
                          values: [
                              { ...API_ALERT, id: 'old', createdAt: '2026-09-28T08:00:00.000Z' },
                              { ...API_ALERT, id: 'new', createdAt: '2026-09-28T08:20:00.000Z' },
                          ],
                      },
                  }
                : undefined,
        );
        const since = Date.parse('2026-09-28T08:10:00.000Z');
        const store = memoryStore({ lastPoll: since });

        const items = await pollingTrigger().run(makeTriggerContext<typeof newAlertTrigger.props>({ auth: ACCOUNT_AUTH, propsValue: props, store }));

        expect(requests()[0].queryParams).toEqual({
            query: `createdAt > ${since} AND (priority: P1)`,
            sort: 'createdAt',
            order: 'asc',
            size: '100',
            offset: '0',
        });
        expect(items).toHaveLength(1);
        expect(firstItem(items)).toMatchObject({ id: 'new' });
        expect(store.data.get('lastPoll')).toBe(Date.parse('2026-09-28T08:20:00.000Z'));
        expect(objectKeys(firstItem(items))).toEqual(fieldKeys(newAlertTrigger.outputSchema?.fields));
    });

    it('pages up to five full pages and then stops', async () => {
        const page = Array.from({ length: 100 }, (_, index) => ({ ...API_ALERT, id: `a${index}`, createdAt: new Date(Date.parse('2026-09-28T09:00:00Z') + index).toISOString() }));
        mockApi(() => ({ status: 200, body: { values: page } }));

        await pollingTrigger().run(
            makeTriggerContext<typeof newAlertTrigger.props>({ auth: ACCOUNT_AUTH, propsValue: { query: undefined }, store: memoryStore({ lastPoll: 1 }) }),
        );

        expect(requests().map((request) => request.queryParams?.['offset'])).toEqual(['0', '100', '200', '300', '400']);
        expect(requests()[0].queryParams?.['query']).toBe('createdAt > 1');
    });

    it('tests with the newest alerts and no time filter', async () => {
        mockApi(() => ({ status: 200, body: { values: [API_ALERT] } }));

        const items = await pollingTrigger().test(
            makeTriggerContext<typeof newAlertTrigger.props>({ auth: ACCOUNT_AUTH, propsValue: { query: undefined }, store: memoryStore() }),
        );

        expect(requests()[0].queryParams).toEqual({ sort: 'createdAt', order: 'desc', size: '10', offset: '0' });
        expect(items).toHaveLength(1);
    });

    it('refuses to enable on an API key connection', async () => {
        const store = memoryStore();

        await expect(
            pollingTrigger().onEnable(makeTriggerContext<typeof newAlertTrigger.props>({ auth: keyAuth(KEY_HOSTS.jsm), propsValue: props, store })),
        ).rejects.toThrow(/The New Alert trigger needs an Atlassian account connection/);
        expect(store.data.has('lastPoll')).toBe(false);
    });

    it('stores the checkpoint when enabled on an account connection', async () => {
        const store = memoryStore();

        await pollingTrigger().onEnable(makeTriggerContext<typeof newAlertTrigger.props>({ auth: ACCOUNT_AUTH, propsValue: props, store }));

        expect(typeof store.data.get('lastPoll')).toBe('number');
    });
});

describe('dropdowns', () => {
    it('lists teams by name', async () => {
        mockApi((request) =>
            request.url === `${ACCOUNT_BASE}/teams` ? { status: 200, body: [{ teamId: 't1', teamName: 'Ops' }] } : undefined,
        );

        const state = await jsmOpsProps.teams({ displayName: 'Teams', description: 'd' }).options({ auth: ACCOUNT_AUTH }, propertyContext());

        expect(state).toEqual({ disabled: false, options: [{ label: 'Ops', value: 't1' }], placeholder: undefined });
    });

    it('lists escalations across teams, labelled with the team', async () => {
        mockApi((request) => {
            if (request.url === `${ACCOUNT_BASE}/teams`) {
                return { status: 200, body: { platformTeams: [{ teamId: 't1', teamName: 'Ops' }, { teamId: 't2', teamName: 'DB' }] } };
            }
            if (request.url === `${ACCOUNT_BASE}/teams/t1/escalations`) {
                return { status: 200, body: { values: [{ id: 'e1', name: 'Ops_escalation' }] } };
            }
            if (request.url === `${ACCOUNT_BASE}/teams/t2/escalations`) {
                return { status: 200, body: { values: [] } };
            }
            return undefined;
        });

        const state = await jsmOpsProps.escalation({ displayName: 'Escalation', description: 'd' }).options({ auth: ACCOUNT_AUTH }, propertyContext());

        expect(state.options).toEqual([{ label: 'Ops_escalation (Ops)', value: 'e1' }]);
    });

    it('lists escalations from every team and pages each team past 100', async () => {
        const teams = Array.from({ length: 30 }, (_, index) => ({ teamId: `t${index}`, teamName: `Team ${index}` }));
        const full = Array.from({ length: 100 }, (_, index) => ({ id: `e${index}`, name: `E${index}` }));
        mockApi((request) => {
            if (request.url === `${ACCOUNT_BASE}/teams`) {
                return { status: 200, body: teams };
            }
            if (request.url === `${ACCOUNT_BASE}/teams/t0/escalations`) {
                return { status: 200, body: { values: request.queryParams?.['offset'] === '0' ? full : [{ id: 'e-last', name: 'Last' }] } };
            }
            if (request.url === `${ACCOUNT_BASE}/teams/t29/escalations`) {
                return { status: 200, body: { values: [{ id: 'e-t29', name: 'Night' }] } };
            }
            return { status: 200, body: { values: [] } };
        });

        const state = await jsmOpsProps.escalation({ displayName: 'Escalation', description: 'd' }).options({ auth: ACCOUNT_AUTH }, propertyContext());

        expect(state.options).toHaveLength(102);
        expect(state.options).toContainEqual({ label: 'Last (Team 0)', value: 'e-last' });
        expect(state.options).toContainEqual({ label: 'Night (Team 29)', value: 'e-t29' });
        expect(requests().filter((request) => request.url === `${ACCOUNT_BASE}/teams/t0/escalations`).map((request) => request.queryParams?.['offset'])).toEqual(['0', '100']);
    });

    it('pages schedules and shows the time zone', async () => {
        const full = Array.from({ length: 50 }, (_, index) => ({ id: `s${index}`, name: `S${index}`, timezone: 'UTC' }));
        mockApi((request) =>
            request.queryParams?.['offset'] === '0' ? { status: 200, body: { values: full } } : { status: 200, body: { values: [{ id: 'last', name: 'Last' }] } },
        );

        const state = await jsmOpsProps.schedule({ displayName: 'Schedule', description: 'd' }).options({ auth: ACCOUNT_AUTH }, propertyContext());

        expect(state.options).toHaveLength(51);
        expect(state.options[0]).toEqual({ label: 'S0 (UTC)', value: 's0' });
        expect(requests().map((request) => request.queryParams?.['offset'])).toEqual(['0', '50']);
    });

    it('searches Jira users on the site and keeps only active people', async () => {
        mockApi((request) =>
            request.url === `${SITE}/rest/api/3/user/search`
                ? {
                      status: 200,
                      body: [
                          { accountId: 'acc-1', accountType: 'atlassian', displayName: 'Jane', emailAddress: 'jane@acme.com', active: true },
                          { accountId: 'bot', accountType: 'app', displayName: 'Bot', active: true },
                          { accountId: 'gone', accountType: 'atlassian', displayName: 'Gone', active: false },
                      ],
                  }
                : undefined,
        );

        const state = await jsmOpsProps.user({ displayName: 'User', description: 'd' }).options({ auth: ACCOUNT_AUTH }, propertyContext('jan'));

        expect(state.options).toEqual([{ label: 'Jane (jane@acme.com)', value: 'acc-1' }]);
        const search = findRequest({ method: 'GET', url: `${SITE}/rest/api/3/user/search` });
        expect(search.queryParams).toEqual({ query: 'jan', maxResults: '50' });
        expect(search.followRedirects).toBe(false);
    });

    it('lists responders by the chosen type', async () => {
        mockApi((request) =>
            request.url === `${ACCOUNT_BASE}/teams` ? { status: 200, body: { platformTeams: [{ teamId: 't1', teamName: 'Ops' }] } } : undefined,
        );
        const dropdown = jsmOpsProps.responder();

        const teamsState = await dropdown.options({ auth: ACCOUNT_AUTH, responderType: 'team' }, propertyContext());
        const emptyState = await dropdown.options({ auth: ACCOUNT_AUTH, responderType: undefined }, propertyContext());

        expect(teamsState.options).toEqual([{ label: 'Ops', value: 't1' }]);
        expect(emptyState).toMatchObject({ disabled: true, placeholder: 'Pick a responder type first.' });
    });

    it('is disabled with a hint on API key connections and before connecting', async () => {
        const dropdown = jsmOpsProps.teams({ displayName: 'Teams', description: 'd' });

        const keyState = await dropdown.options({ auth: keyAuth(KEY_HOSTS.jsm) }, propertyContext());
        const noAuth = await dropdown.options({}, propertyContext());

        expect(keyState).toMatchObject({ disabled: true, placeholder: expect.stringContaining('Atlassian Account connection') });
        expect(noAuth).toMatchObject({ disabled: true });
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('shows the API error in the placeholder instead of throwing', async () => {
        mockApi(() => ({ status: 403, body: { errors: [{ title: 'Forbidden', code: 'x' }] } }));

        const state = await jsmOpsProps.teams({ displayName: 'Teams', description: 'd' }).options({ auth: ACCOUNT_AUTH }, propertyContext());

        expect(state).toMatchObject({ disabled: true, placeholder: expect.stringContaining('HTTP 403): Forbidden') });
    });
});

describe('output schemas', () => {
    it('matches what the write actions return', async () => {
        mockApi((request) => {
            if (request.method === 'POST') {
                return accepted('req-s');
            }
            return processed({ requestId: 'req-s', alertId: 'alert-1', success: true, status: 'ok' });
        });

        const result = await settle(
            addTagsAction.run(makeContext<typeof addTagsAction.props>({ auth: ACCOUNT_AUTH, propsValue: { alert: 'alert-1', identifierType: 'id', tags: ['x'] } })),
        );

        expect(objectKeys(result)).toEqual(fieldKeys(addTagsAction.outputSchema?.fields));
        expect(fieldKeys(createAlertAction.outputSchema?.fields)).toEqual(objectKeys(result));
    });
});

type JsmConnection = AppConnectionValueForAuthProperty<typeof jsmOpsAuth>;

type Request = {
    method: string;
    url: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    body?: unknown;
    timeout?: number;
    followRedirects?: boolean;
};

type Reply = { status: number; body: unknown };

type Handler = (request: Request) => Reply | undefined;

type ProcessedParams = { requestId: string; alertId: string; success: boolean; status: string };

type Settled<T> = { ok: true; value: T } | { ok: false; error: unknown };

type TriggerContextParams<Props extends InputPropertyMap> = {
    propsValue: StaticPropsValue<Props>;
    auth: JsmConnection;
    store: ReturnType<typeof memoryStore>;
};
