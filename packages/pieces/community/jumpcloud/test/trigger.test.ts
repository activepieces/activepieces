import { httpClient } from '@activepieces/pieces-common';
import {
    AppConnectionType,
    AppConnectionValueForAuthProperty,
    createMockActionContext,
    createMockPollingTriggerContext,
    InputPropertyMap,
    StaticPropsValue,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jumpcloud } from '../src';
import { jumpcloudAuth } from '../src/lib/auth';
import { jumpcloudObjects } from '../src/lib/common/objects';
import { jumpcloudOutput } from '../src/lib/common/output';
import { newObjectTrigger } from '../src/lib/triggers/new-object';

const sendRequest = vi.fn();

const V1 = 'https://console.jumpcloud.com/api';
const V2 = 'https://console.jumpcloud.com/api/v2';
const LAST_POLL = Date.parse('2026-10-06T12:00:00.000Z');

beforeEach(() => {
    sendRequest.mockReset();
    vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => sendRequest(request));
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('createdAt', () => {
    it('reads the created timestamp', () => {
        expect(jumpcloudObjects.createdAt({ type: 'user', record: { _id: 'x', created: '2026-10-06T12:00:01.500Z' } })).toBe(LAST_POLL + 1500);
    });

    it('falls back to the time inside the object ID', () => {
        const seconds = Math.floor(LAST_POLL / 1000) + 30;
        expect(jumpcloudObjects.createdAt({ type: 'user_group', record: { id: objectId(seconds) } })).toBe(seconds * 1000);
    });

    it('gives up without a usable timestamp or ID', () => {
        expect(jumpcloudObjects.createdAt({ type: 'user_group', record: { id: 'not-an-object-id' } })).toBeNull();
        expect(jumpcloudObjects.createdAt({ type: 'user', record: { _id: 'u1', created: 'yesterday' } })).toBeNull();
    });
});

describe('New Object trigger', () => {
    it('is registered and tagged for agents', () => {
        expect(Object.keys(jumpcloud.triggers())).toEqual(['new_object']);
        expect(newObjectTrigger.classification).toBe('READ');
        expect(newObjectTrigger.aiMetadata?.description?.length ?? 0).toBeGreaterThan(40);
    });

    it('emits only users created since the last poll, newest first', async () => {
        sendRequest.mockResolvedValue({
            status: 200,
            body: {
                totalCount: 3,
                results: [user('u3', LAST_POLL + 2000), user('u2', LAST_POLL + 1000), user('u1', LAST_POLL - 1000)],
            },
        });
        const store = memoryStore({ lastPoll: LAST_POLL });

        const result = await pollingTrigger().run(triggerContext<typeof newObjectTrigger.props>({ propsValue: { objectType: 'user' }, store }));

        expect(sendRequest.mock.calls[0][0]).toMatchObject({ url: `${V1}/systemusers`, queryParams: { sort: '-created', skip: '0', limit: '100' } });
        expect(sendRequest).toHaveBeenCalledTimes(1);
        expect(result).toEqual([
            expect.objectContaining({ object_type: 'user', id: 'u3' }),
            expect.objectContaining({ object_type: 'user', id: 'u2' }),
        ]);
        expect(store.data.get('lastPoll')).toBe(LAST_POLL + 2000);
    });

    it('keeps paging while every object on the page is new', async () => {
        sendRequest.mockImplementation(async (request: Request) => {
            const skip = Number(request.queryParams?.['skip']);
            const page = Array.from({ length: skip === 0 ? 100 : 1 }, (_, index) => user(`u${skip + index}`, LAST_POLL + 100000 - skip - index));
            return { status: 200, body: { totalCount: 101, results: page } };
        });

        const result = await pollingTrigger().run(triggerContext<typeof newObjectTrigger.props>({ propsValue: { objectType: 'system' }, store: memoryStore({ lastPoll: LAST_POLL }) }));

        expect(sendRequest.mock.calls.map(([request]) => request.queryParams?.['skip'])).toEqual(['0', '100']);
        expect(result).toHaveLength(101);
    });

    it('detects new groups from the time inside their ID', async () => {
        const seconds = Math.floor(LAST_POLL / 1000);
        sendRequest.mockResolvedValue({
            status: 200,
            body: [
                { id: objectId(seconds - 60), name: 'Old' },
                { id: objectId(seconds + 60), name: 'New' },
                { id: 'not-an-object-id', name: 'Unknown' },
            ],
        });

        const result = await pollingTrigger().run(
            triggerContext<typeof newObjectTrigger.props>({ propsValue: { objectType: 'user_group' }, store: memoryStore({ lastPoll: LAST_POLL }) }),
        );

        expect(sendRequest.mock.calls[0][0]).toMatchObject({ url: `${V2}/usergroups`, queryParams: { sort: 'name' } });
        expect(result).toEqual([expect.objectContaining({ object_type: 'user_group', name: 'New' })]);
    });

    it('starts from now when enabled and keeps the checkpoint on republish', async () => {
        const store = memoryStore();
        await pollingTrigger().onEnable(triggerContext<typeof newObjectTrigger.props>({ propsValue: { objectType: 'user' }, store }));
        const firstPoll = store.data.get('lastPoll');

        expect(typeof firstPoll).toBe('number');
        expect(sendRequest).not.toHaveBeenCalled();

        await pollingTrigger().onEnable({ ...triggerContext<typeof newObjectTrigger.props>({ propsValue: { objectType: 'user' }, store }), isRepublish: true });
        expect(store.data.get('lastPoll')).toBe(firstPoll);
    });

    it('returns up to five recent objects when testing', async () => {
        sendRequest.mockResolvedValue({
            status: 200,
            body: { totalCount: 7, results: Array.from({ length: 7 }, (_, index) => user(`u${index}`, LAST_POLL - index * 1000)) },
        });

        const result = await pollingTrigger().test(triggerContext<typeof newObjectTrigger.props>({ propsValue: { objectType: 'user' }, store: memoryStore() }));

        expect(result).toHaveLength(5);
        expect(result[0]).toMatchObject({ id: 'u0' });
    });

    it('keeps the sample data in the shape of a user output', () => {
        expect(Object.keys(newObjectTrigger.sampleData ?? {})).toEqual([
            'object_type',
            ...Object.keys(jumpcloudOutput.flatten({ type: 'user', record: {} })),
        ]);
    });
});

function pollingTrigger() {
    const trigger = newObjectTrigger;
    if (trigger.type !== TriggerStrategy.POLLING) {
        throw new Error('expected a polling trigger');
    }
    return trigger;
}

function user(id: string, epochMs: number) {
    return { _id: id, username: id, created: new Date(epochMs).toISOString() };
}

function objectId(seconds: number): string {
    return `${seconds.toString(16).padStart(8, '0')}0000000000000000`;
}

function triggerContext<Props extends InputPropertyMap>({ propsValue, store }: { propsValue: StaticPropsValue<Props>; store: ReturnType<typeof memoryStore> }) {
    const { files } = createMockActionContext<Props>({ propsValue });
    return { ...createMockPollingTriggerContext<Props>({ propsValue }), auth: CONNECTION, store, files };
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
            return value === undefined ? null : JSON.parse(JSON.stringify(value));
        },
        delete: async (key: string): Promise<void> => {
            data.delete(key);
        },
    };
}

const CONNECTION: AppConnectionValueForAuthProperty<typeof jumpcloudAuth> = {
    type: AppConnectionType.CUSTOM_AUTH,
    props: { apiKey: 'key', region: 'us', orgId: undefined },
};

type Request = {
    method: string;
    url: string;
    queryParams?: Record<string, string>;
};
