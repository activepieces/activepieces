import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@activepieces/pieces-common';
import { createMockActionContext, Store } from '@activepieces/pieces-framework';
import { newUserTrigger } from '../src/lib/triggers/new-user';
import { newGroupTrigger } from '../src/lib/triggers/new-group';
import { newDeletedUserTrigger } from '../src/lib/triggers/new-deleted-user';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
    return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

const AUTH = { access_token: 'tok', type: 'OAUTH2', props: {} };
const G = 'https://graph.microsoft.com/v1.0';
const HOUR = 60 * 60 * 1000;
const T0 = Date.parse('2026-11-14T10:00:00Z');

function memoryStore(): { store: Store; data: Map<string, unknown> } {
    const data = new Map<string, unknown>();
    const store: Store = {
        put: async (key, value) => {
            data.set(key, value);
            return value;
        },
        get: async <T>(key: string): Promise<T | null> => {
            const v: unknown = data.get(key);
            return v === undefined ? null : JSON.parse(JSON.stringify(v));
        },
        delete: async (key) => {
            data.delete(key);
        },
    };
    return { store, data };
}

function respond({ body }: { body: unknown }) {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function hook({ trigger, store, isRepublish = false }: { trigger: { run: unknown }; store: Store; isRepublish?: boolean }) {
    return { ...createMockActionContext({ propsValue: {} }), auth: AUTH, store, isRepublish, setSchedule: () => undefined, trigger };
}

function invoke({ trigger, method, store }: { trigger: Record<string, unknown>; method: 'onEnable' | 'onDisable' | 'run' | 'test'; store: Store }): Promise<unknown> {
    const fn = trigger[method];
    if (typeof fn !== 'function') throw new Error(`no ${method}`);
    return Reflect.apply(fn, trigger, [hook({ trigger, store })]);
}

function url({ index }: { index: number }): string {
    return decodeURIComponent(sendRequest.mock.calls[index][0].url);
}

function user({ id, created }: { id: string; created: number }) {
    return { id, displayName: id, createdDateTime: new Date(created).toISOString() };
}

function full({ id, created }: { id: string; created: number }) {
    return { ...USER_NULLS, ...user({ id, created }) };
}

const USER_NULLS = { userPrincipalName: null, mail: null, givenName: null, surname: null, jobTitle: null, mobilePhone: null, accountEnabled: null };

beforeEach(() => {
    sendRequest.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(T0);
});

afterEach(() => vi.useRealTimers());

describe('new_user', () => {
    it('seeds on enable, then emits only new users across several polls', async () => {
        const { store } = memoryStore();
        respond({ body: { value: [], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d0` } });
        await invoke({ trigger: newUserTrigger, method: 'onEnable', store });
        expect(url({ index: 0 })).toBe(`${G}/users/delta?$deltaToken=latest&$select=id,displayName,userPrincipalName,mail,givenName,surname,jobTitle,mobilePhone,accountEnabled,createdDateTime`);

        vi.setSystemTime(T0 + 5 * 60000);
        respond({ body: { value: [user({ id: 'new1', created: T0 + 60000 }), user({ id: 'old', created: T0 - 30 * 24 * HOUR })], '@odata.nextLink': `${G}/users/delta?$skiptoken=p2` } });
        respond({ body: { value: [user({ id: 'new2', created: T0 + 2 * 60000 }), { id: 'gone', '@removed': { reason: 'changed' } }], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d1` } });
        const first = await invoke({ trigger: newUserTrigger, method: 'run', store });
        expect(url({ index: 1 })).toBe(`${G}/users/delta?$deltatoken=d0`);
        expect(url({ index: 2 })).toBe(`${G}/users/delta?$skiptoken=p2`);
        expect(first).toEqual([full({ id: 'new1', created: T0 + 60000 }), full({ id: 'new2', created: T0 + 2 * 60000 })]);

        vi.setSystemTime(T0 + 10 * 60000);
        respond({ body: { value: [
            { ...user({ id: 'new1', created: T0 + 60000 }), displayName: 'renamed' },
            user({ id: 'late', created: T0 + 30000 }),
        ], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d2` } });
        const second = await invoke({ trigger: newUserTrigger, method: 'run', store });
        expect(url({ index: 3 })).toBe(`${G}/users/delta?$deltatoken=d1`);
        expect(second).toEqual([full({ id: 'late', created: T0 + 30000 })]);
    });

    it('does not emit users created before the trigger was enabled, even when they change later', async () => {
        const { store } = memoryStore();
        respond({ body: { value: [], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d0` } });
        await invoke({ trigger: newUserTrigger, method: 'onEnable', store });
        vi.setSystemTime(T0 + 60000);
        respond({ body: { value: [user({ id: 'before', created: T0 - 60000 })], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d1` } });
        expect(await invoke({ trigger: newUserTrigger, method: 'run', store })).toEqual([]);
    });

    it('keeps the old delta link when a later page fails', async () => {
        const { store, data } = memoryStore();
        respond({ body: { value: [], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d0` } });
        await invoke({ trigger: newUserTrigger, method: 'onEnable', store });
        const before = structuredClone(data.get('_new_user_state'));
        respond({ body: { value: [user({ id: 'n', created: T0 + 1 })], '@odata.nextLink': `${G}/users/delta?$skiptoken=p2` } });
        sendRequest.mockRejectedValueOnce(new HttpError(undefined, { status: 503, responseBody: { error: { code: 'ServiceUnavailable', message: 'busy' } } }));
        await expect(invoke({ trigger: newUserTrigger, method: 'run', store })).rejects.toThrow(/\(503\)/);
        expect(data.get('_new_user_state')).toEqual(before);
        respond({ body: { value: [user({ id: 'n', created: T0 + 1 })], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d1` } });
        expect(await invoke({ trigger: newUserTrigger, method: 'run', store })).toHaveLength(1);
        expect(url({ index: 3 })).toBe(`${G}/users/delta?$deltatoken=d0`);
    });

    it('looks up createdDateTime when delta omits it', async () => {
        const { store } = memoryStore();
        respond({ body: { value: [], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d0` } });
        await invoke({ trigger: newUserTrigger, method: 'onEnable', store });
        respond({ body: { value: [{ id: 'x', displayName: 'X' }], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d1` } });
        respond({ body: user({ id: 'x', created: T0 + 1000 }) });
        const out = await invoke({ trigger: newUserTrigger, method: 'run', store });
        expect(url({ index: 2 })).toMatch(new RegExp(`^${G}/users/x\\?\\$select=`));
        expect(out).toEqual([full({ id: 'x', created: T0 + 1000 })]);
    });

    it('tells the user how to recover when too many objects lack a creation time', async () => {
        const { store, data } = memoryStore();
        data.set('_delta_link_new_user', `${G}/users/delta?$deltatoken=d0`);
        const items = Array.from({ length: 101 }, (_, i) => ({ id: `x${i}` }));
        respond({ body: { value: items, '@odata.deltaLink': `${G}/users/delta?$deltatoken=d1` } });
        await expect(invoke({ trigger: newUserTrigger, method: 'run', store })).rejects.toThrow(/state was not advanced\. Disable and re-enable the trigger to start from now\.$/);
        expect(sendRequest).toHaveBeenCalledTimes(1);
    });

    it('upgrades from the old pollingHelper state without re-emitting', async () => {
        const { store, data } = memoryStore();
        data.set('_delta_link_new_user', `${G}/users/delta?$deltatoken=legacy`);
        data.set('lastPoll', T0 - HOUR);
        respond({ body: { value: [user({ id: 'emitted', created: T0 - HOUR }), user({ id: 'fresh', created: T0 - 1000 })], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d1` } });
        const out = await invoke({ trigger: newUserTrigger, method: 'run', store });
        expect(url({ index: 0 })).toBe(`${G}/users/delta?$deltatoken=legacy`);
        expect(out).toEqual([full({ id: 'fresh', created: T0 - 1000 })]);
    });

    it('test() reads the newest users instead of returning nothing', async () => {
        const { store } = memoryStore();
        respond({ body: { value: [user({ id: 'u', created: T0 })] } });
        expect(await invoke({ trigger: newUserTrigger, method: 'test', store })).toEqual([full({ id: 'u', created: T0 })]);
        expect(url({ index: 0 })).toContain(`${G}/users?$select=`);
        expect(url({ index: 0 })).toContain('$orderby=createdDateTime desc&$top=5&$count=true');
        expect(sendRequest.mock.calls[0][0].headers.ConsistencyLevel).toBe('eventual');
    });

    it('onDisable clears new and legacy state', async () => {
        const { store, data } = memoryStore();
        data.set('_new_user_state', {});
        data.set('_delta_link_new_user', 'x');
        data.set('lastPoll', 1);
        await invoke({ trigger: newUserTrigger, method: 'onDisable', store });
        expect(data.size).toBe(0);
    });
});

describe('payload shape', () => {
    it('live, test and sample payloads have the same keys, with nulls filled and @odata keys removed', async () => {
        const { store } = memoryStore();
        respond({ body: { value: [], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d0` } });
        await invoke({ trigger: newUserTrigger, method: 'onEnable', store });
        respond({ body: { value: [{ ...user({ id: 'n', created: T0 + 1 }), '@odata.type': '#microsoft.graph.user' }], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d1` } });
        const live = await invoke({ trigger: newUserTrigger, method: 'run', store });
        respond({ body: { value: [user({ id: 'n', created: T0 + 1 })] } });
        const test = await invoke({ trigger: newUserTrigger, method: 'test', store });
        const keysOf = (v: unknown) => Object.keys(Array.isArray(v) ? v[0] : {}).sort();
        expect(keysOf(live)).toEqual(Object.keys(newUserTrigger.sampleData ?? {}).sort());
        expect(keysOf(test)).toEqual(keysOf(live));
        expect(keysOf(live)).toEqual((newUserTrigger.outputSchema?.fields ?? []).map((f) => f.key).sort());
    });

    it('defaults a missing groupTypes to [] and keeps a real one', async () => {
        const { store } = memoryStore();
        respond({ body: { value: [], '@odata.deltaLink': `${G}/groups/delta?$deltatoken=d0` } });
        await invoke({ trigger: newGroupTrigger, method: 'onEnable', store });
        respond({ body: { value: [
            { id: 'sec', displayName: 'Sec', createdDateTime: new Date(T0 + 1).toISOString() },
            { id: 'm365', displayName: 'M', groupTypes: ['Unified'], createdDateTime: new Date(T0 + 2).toISOString() },
        ], '@odata.deltaLink': `${G}/groups/delta?$deltatoken=d1` } });
        const out = await invoke({ trigger: newGroupTrigger, method: 'run', store });
        expect(out).toEqual([
            expect.objectContaining({ id: 'sec', groupTypes: [], mail: null }),
            expect.objectContaining({ id: 'm365', groupTypes: ['Unified'] }),
        ]);
    });

    it('fills group nulls too', async () => {
        const { store } = memoryStore();
        respond({ body: { value: [{ id: 'g', displayName: 'G', createdDateTime: new Date(T0).toISOString() }] } });
        const out = await invoke({ trigger: newGroupTrigger, method: 'test', store });
        expect(Object.keys(Array.isArray(out) ? out[0] : {}).sort()).toEqual((newGroupTrigger.outputSchema?.fields ?? []).map((f) => f.key).sort());
        expect(out).toEqual([expect.objectContaining({ description: null, mail: null, visibility: null })]);
    });
});

describe('new_group', () => {
    it('uses the groups delta endpoint', async () => {
        const { store } = memoryStore();
        respond({ body: { value: [], '@odata.deltaLink': `${G}/groups/delta?$deltatoken=d0` } });
        await invoke({ trigger: newGroupTrigger, method: 'onEnable', store });
        expect(url({ index: 0 })).toContain(`${G}/groups/delta?$deltaToken=latest`);
        respond({ body: { value: [user({ id: 'g', created: T0 + 1 })], '@odata.deltaLink': `${G}/groups/delta?$deltatoken=d1` } });
        expect(await invoke({ trigger: newGroupTrigger, method: 'run', store })).toHaveLength(1);
    });
});

describe('new_deleted_user', () => {
    it('run and test return the same shape; permanent deletes come back with null profile', async () => {
        const { store, data } = memoryStore();
        respond({ body: { value: [], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d0` } });
        await invoke({ trigger: newDeletedUserTrigger, method: 'onEnable', store });
        expect(data.get('_new_deleted_user_state')).toEqual({ deltaLink: `${G}/users/delta?$deltatoken=d0`, seen: [] });

        respond({ body: { value: [
            { id: 'soft', '@removed': { reason: 'changed' } },
            { id: 'hard', '@removed': { reason: 'deleted' } },
            { id: 'alive', displayName: 'A' },
        ], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d1` } });
        respond({ body: { id: 'soft', displayName: 'Soft', userPrincipalName: 'soft@x.com', mail: null, givenName: 'S', surname: 'Oft', deletedDateTime: '2026-11-14T10:00:00Z' } });
        sendRequest.mockRejectedValueOnce(new HttpError(undefined, { status: 404, responseBody: { error: { code: 'Request_ResourceNotFound', message: 'gone' } } }));
        const out = await invoke({ trigger: newDeletedUserTrigger, method: 'run', store });
        expect(url({ index: 2 })).toBe(`${G}/directory/deletedItems/soft?$select=id,displayName,userPrincipalName,mail,givenName,surname,deletedDateTime`);
        expect(out).toEqual([
            { id: 'soft', displayName: 'Soft', userPrincipalName: 'soft@x.com', mail: null, givenName: 'S', surname: 'Oft', deletedDateTime: '2026-11-14T10:00:00Z', removedReason: 'changed', profileLookedUp: true },
            { id: 'hard', displayName: null, userPrincipalName: null, mail: null, givenName: null, surname: null, deletedDateTime: null, removedReason: 'deleted', profileLookedUp: true },
        ]);
        expect(data.get('_new_deleted_user_state')).toMatchObject({ deltaLink: `${G}/users/delta?$deltatoken=d1` });

        respond({ body: { value: [{ id: 'soft', displayName: 'Soft', deletedDateTime: '2026-11-14T10:00:00Z' }] } });
        const sample = await invoke({ trigger: newDeletedUserTrigger, method: 'test', store });
        expect(Object.keys((Array.isArray(sample) ? sample : [])[0]).sort()).toEqual(Object.keys(out instanceof Array ? out[0] : {}).sort());
        expect(Object.keys(newDeletedUserTrigger.sampleData ?? {}).sort()).toEqual(Object.keys(out instanceof Array ? out[0] : {}).sort());
    });

    it('fires once when the delta repeats the same soft delete on later polls, and migrates the old state', async () => {
        const { store, data } = memoryStore();
        data.set('_delta_link_new_deleted_user', `${G}/users/delta?$deltatoken=d0`);
        const removal = { id: 'dup', '@removed': { reason: 'changed' } };
        const profile = { id: 'dup', displayName: 'Dup', deletedDateTime: '2026-11-15T07:12:03Z' };
        respond({ body: { value: [removal, removal], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d1` } });
        respond({ body: profile });
        respond({ body: profile });
        const first = await invoke({ trigger: newDeletedUserTrigger, method: 'run', store });
        expect(url({ index: 0 })).toBe(`${G}/users/delta?$deltatoken=d0`);
        expect(first).toEqual([expect.objectContaining({ id: 'dup', removedReason: 'changed', deletedDateTime: '2026-11-15T07:12:03Z' })]);

        vi.setSystemTime(T0 + 5 * 60000);
        respond({ body: { value: [removal], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d2` } });
        respond({ body: profile });
        expect(await invoke({ trigger: newDeletedUserTrigger, method: 'run', store })).toEqual([]);
        expect(url({ index: 3 })).toBe(`${G}/users/delta?$deltatoken=d1`);

        vi.setSystemTime(T0 + 10 * 60000);
        respond({ body: { value: [{ id: 'dup', '@removed': { reason: 'deleted' } }], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d3` } });
        sendRequest.mockRejectedValueOnce(new HttpError(undefined, { status: 404, responseBody: {} }));
        expect(await invoke({ trigger: newDeletedUserTrigger, method: 'run', store })).toEqual([expect.objectContaining({ id: 'dup', removedReason: 'deleted' })]);
        expect(data.get('_new_deleted_user_state')).toMatchObject({ deltaLink: `${G}/users/delta?$deltatoken=d3`, seen: [{ key: 'dup|2026-11-15T07:12:03Z' }, { key: 'dup|deleted' }] });

        vi.setSystemTime(T0 + 25 * HOUR);
        respond({ body: { value: [], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d4` } });
        await invoke({ trigger: newDeletedUserTrigger, method: 'run', store });
        expect(data.get('_new_deleted_user_state')).toMatchObject({ seen: [] });
    });

    it('marks removals past the 100-lookup cap with profileLookedUp=false', async () => {
        const { store, data } = memoryStore();
        data.set('_delta_link_new_deleted_user', `${G}/users/delta?$deltatoken=d0`);
        const removed = Array.from({ length: 101 }, (_, i) => ({ id: `u${i + 1}`, '@removed': { reason: 'changed' } }));
        respond({ body: { value: removed, '@odata.deltaLink': `${G}/users/delta?$deltatoken=d1` } });
        for (let i = 0; i < 100; i++) {
            respond({ body: { id: `u${i + 1}`, displayName: `U${i + 1}`, deletedDateTime: '2026-11-14T10:00:00Z' } });
        }
        const out = await invoke({ trigger: newDeletedUserTrigger, method: 'run', store });
        const events = Array.isArray(out) ? out : [];
        expect(events).toHaveLength(101);
        expect(sendRequest).toHaveBeenCalledTimes(101);
        expect(events[99]).toMatchObject({ id: 'u100', displayName: 'U100', profileLookedUp: true });
        expect(events[100]).toEqual({ id: 'u101', displayName: null, userPrincipalName: null, mail: null, givenName: null, surname: null, deletedDateTime: null, removedReason: 'changed', profileLookedUp: false });
    });

    it('does not advance the delta link when a lookup fails with a non-404', async () => {
        const { store, data } = memoryStore();
        data.set('_delta_link_new_deleted_user', `${G}/users/delta?$deltatoken=d0`);
        respond({ body: { value: [{ id: 'soft', '@removed': { reason: 'changed' } }], '@odata.deltaLink': `${G}/users/delta?$deltatoken=d1` } });
        sendRequest.mockRejectedValueOnce(new HttpError(undefined, { status: 500, responseBody: {} }));
        await expect(invoke({ trigger: newDeletedUserTrigger, method: 'run', store })).rejects.toThrow(/\(500\)/);
        expect(data.get('_delta_link_new_deleted_user')).toBe(`${G}/users/delta?$deltatoken=d0`);
        expect(data.has('_new_deleted_user_state')).toBe(false);
    });
});
