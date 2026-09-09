import { HttpError } from '@activepieces/pieces-common';
import { DEDUPE_KEY_PROPERTY, Store } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { segmentMembershipChangedTrigger } from '../src/lib/triggers/segment-membership-changed';

const SEGMENT_ID = 'seg_1';
const SINCE_KEY = 'floqer_segment_since';
const FILTER_HASH_KEY = 'floqer_segment_filter_hash';

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

function createStore(initial: Record<string, unknown> = {}): Store {
    const state = new Map<string, unknown>(Object.entries(initial));
    return {
        get: async <T>(key: string) => (state.has(key) ? (state.get(key) as T) : null),
        put: async <T>(key: string, value: T) => {
            state.set(key, value);
            return value;
        },
        delete: async (key: string) => {
            state.delete(key);
        },
    };
}

function changesPage(overrides: Record<string, unknown> = {}) {
    return {
        body: {
            segmentId: SEGMENT_ID,
            filterHash: 'hash-a',
            maxSeq: 0,
            minRetainedSeq: 0,
            changes: [],
            hasMore: false,
            nextSince: 0,
            ...overrides,
        },
    };
}

function change(seq: number, kind = 'enter') {
    return { seq, entityId: `e${seq}`, kind, at: '2026-09-09T10:00:00.000Z' };
}

function httpError(status: number, code: string) {
    return new HttpError({}, { status, responseBody: { error: { code, message: code } } });
}

function context({ store, propsValue = { segmentId: SEGMENT_ID }, ...rest }: Record<string, unknown> & { store: Store }) {
    return {
        auth: { type: 'SECRET_TEXT', secret_text: 'floq_test' },
        propsValue,
        store,
        ...rest,
    };
}

function runTrigger(ctx: unknown) {
    return segmentMembershipChangedTrigger.run(ctx as never);
}

function enableTrigger(ctx: unknown) {
    return segmentMembershipChangedTrigger.onEnable(ctx as never);
}

beforeEach(() => {
    sendRequest.mockReset();
});

describe('onEnable', () => {
    it('bootstraps at the head and emits nothing', async () => {
        sendRequest.mockResolvedValueOnce(changesPage({ bootstrapped: true, nextSince: 42 }));
        const store = createStore();

        await enableTrigger(context({ store }));

        expect(await store.get(SINCE_KEY)).toBe(42);
        expect(await store.get(FILTER_HASH_KEY)).toBe('hash-a');
        expect(sendRequest.mock.calls[0][0].queryParams).toEqual({ since: '0' });
    });

    it('keeps the existing cursor when the flow is republished', async () => {
        const store = createStore({ [SINCE_KEY]: 99, [FILTER_HASH_KEY]: 'hash-a' });

        await enableTrigger(context({ store, isRepublish: true }));

        expect(sendRequest).not.toHaveBeenCalled();
        expect(await store.get(SINCE_KEY)).toBe(99);
    });

    it('bootstraps on republish when no cursor was stored', async () => {
        sendRequest.mockResolvedValueOnce(changesPage({ nextSince: 7 }));
        const store = createStore();

        await enableTrigger(context({ store, isRepublish: true }));

        expect(await store.get(SINCE_KEY)).toBe(7);
    });
});

describe('run', () => {
    it('sends the stored cursor as a query parameter, not a body', async () => {
        sendRequest.mockResolvedValueOnce(changesPage({ nextSince: 10 }));
        const store = createStore({ [SINCE_KEY]: 10, [FILTER_HASH_KEY]: 'hash-a' });

        await runTrigger(context({ store }));

        const request = sendRequest.mock.calls[0][0];
        expect(request.queryParams).toEqual({ since: '10' });
        expect(request.body).toBeUndefined();
    });

    it('emits only rows above the stored cursor', async () => {
        sendRequest.mockResolvedValueOnce(
            changesPage({ changes: [change(10), change(11), change(12)], nextSince: 12 }),
        );
        const store = createStore({ [SINCE_KEY]: 10, [FILTER_HASH_KEY]: 'hash-a' });

        const result = await runTrigger(context({ store }));

        expect(result.map((row) => (row as { seq: number }).seq)).toEqual([11, 12]);
        expect(await store.get(SINCE_KEY)).toBe(12);
    });

    it('is idempotent when the same cursor is polled twice', async () => {
        const page = changesPage({ changes: [change(11)], nextSince: 11 });
        sendRequest.mockResolvedValueOnce(page).mockResolvedValueOnce(page);
        const store = createStore({ [SINCE_KEY]: 10, [FILTER_HASH_KEY]: 'hash-a' });

        const first = await runTrigger(context({ store }));
        const second = await runTrigger(context({ store }));

        expect(first).toHaveLength(1);
        expect(second).toHaveLength(0);
    });

    it('tags each row with a dedupe key unique per change', async () => {
        sendRequest.mockResolvedValueOnce(
            changesPage({
                changes: [change(11, 'enter'), change(12, 'exit'), change(13, 'reenter')],
                nextSince: 13,
            }),
        );
        const store = createStore({ [SINCE_KEY]: 10, [FILTER_HASH_KEY]: 'hash-a' });

        const result = await runTrigger(context({ store }));
        const keys = result.map((row) => (row as Record<string, unknown>)[DEDUPE_KEY_PROPERTY]);

        expect(keys).toEqual([`${SEGMENT_ID}:11`, `${SEGMENT_ID}:12`, `${SEGMENT_ID}:13`]);
        expect(new Set(keys).size).toBe(3);
    });

    it('drains every page while hasMore is set', async () => {
        sendRequest
            .mockResolvedValueOnce(
                changesPage({ changes: [change(11)], hasMore: true, nextSince: 11 }),
            )
            .mockResolvedValueOnce(
                changesPage({ changes: [change(12)], hasMore: true, nextSince: 12 }),
            )
            .mockResolvedValueOnce(changesPage({ changes: [change(13)], nextSince: 13 }));
        const store = createStore({ [SINCE_KEY]: 10, [FILTER_HASH_KEY]: 'hash-a' });

        const result = await runTrigger(context({ store }));

        expect(result).toHaveLength(3);
        expect(sendRequest).toHaveBeenCalledTimes(3);
        expect(await store.get(SINCE_KEY)).toBe(13);
    });

    it('writes the cursor after each page, not only at the end', async () => {
        const seen: unknown[] = [];
        sendRequest
            .mockImplementationOnce(async () => {
                seen.push('page-1');
                return changesPage({ changes: [change(11)], hasMore: true, nextSince: 11 });
            })
            .mockImplementationOnce(async () => {
                seen.push(await store.get(SINCE_KEY));
                return changesPage({ changes: [change(12)], nextSince: 12 });
            });
        const store = createStore({ [SINCE_KEY]: 10, [FILTER_HASH_KEY]: 'hash-a' });

        await runTrigger(context({ store }));

        expect(seen).toEqual(['page-1', 11]);
    });

    it('stops when hasMore is set but the cursor does not advance', async () => {
        sendRequest.mockResolvedValue(changesPage({ hasMore: true, nextSince: 10 }));
        const store = createStore({ [SINCE_KEY]: 10, [FILTER_HASH_KEY]: 'hash-a' });

        const result = await runTrigger(context({ store }));

        expect(result).toHaveLength(0);
        expect(sendRequest).toHaveBeenCalledTimes(1);
    });

    it('skips the tick on 409 without touching the cursor', async () => {
        sendRequest.mockRejectedValueOnce(httpError(409, 'LOCK_BUSY'));
        const store = createStore({ [SINCE_KEY]: 10, [FILTER_HASH_KEY]: 'hash-a' });

        const result = await runTrigger(context({ store }));

        expect(result).toEqual([]);
        expect(await store.get(SINCE_KEY)).toBe(10);
    });

    it('throws and keeps the cursor on 410', async () => {
        sendRequest.mockRejectedValueOnce(httpError(410, 'CURSOR_EXPIRED'));
        const store = createStore({ [SINCE_KEY]: 10, [FILTER_HASH_KEY]: 'hash-a' });

        await expect(runTrigger(context({ store }))).rejects.toThrow(/re-synced.*cursor_expired/s);
        expect(await store.get(SINCE_KEY)).toBe(10);
    });

    it('throws on a reconcile response instead of reporting empty success', async () => {
        sendRequest.mockResolvedValueOnce(
            changesPage({ reconcile: true, reason: 'cursor_ahead', nextSince: 10 }),
        );
        const store = createStore({ [SINCE_KEY]: 10, [FILTER_HASH_KEY]: 'hash-a' });

        await expect(runTrigger(context({ store }))).rejects.toThrow(/cursor_ahead/);
        expect(await store.get(SINCE_KEY)).toBe(10);
    });

    it('throws an actionable error when segment sync is not provisioned', async () => {
        sendRequest.mockRejectedValueOnce(httpError(503, 'SYNC_TABLES_UNAVAILABLE'));
        const store = createStore({ [SINCE_KEY]: 10, [FILTER_HASH_KEY]: 'hash-a' });

        await expect(runTrigger(context({ store }))).rejects.toThrow(
            /has not enabled segment sync/,
        );
    });

    it('throws when the segment filter changed underneath the cursor', async () => {
        sendRequest.mockResolvedValueOnce(
            changesPage({ filterHash: 'hash-b', changes: [change(11)], nextSince: 11 }),
        );
        const store = createStore({ [SINCE_KEY]: 10, [FILTER_HASH_KEY]: 'hash-a' });

        await expect(runTrigger(context({ store }))).rejects.toThrow(/filter_changed/);
    });

    it('does not reconcile when filter hashes are null on both sides', async () => {
        sendRequest.mockResolvedValueOnce(
            changesPage({ filterHash: null, changes: [change(11)], nextSince: 11 }),
        );
        const store = createStore({ [SINCE_KEY]: 10, [FILTER_HASH_KEY]: null });

        const result = await runTrigger(context({ store }));

        expect(result).toHaveLength(1);
    });

    it('does not reconcile when only one side has a null hash', async () => {
        sendRequest.mockResolvedValueOnce(
            changesPage({ filterHash: null, changes: [change(11)], nextSince: 11 }),
        );
        const store = createStore({ [SINCE_KEY]: 10, [FILTER_HASH_KEY]: 'hash-a' });

        const result = await runTrigger(context({ store }));

        expect(result).toHaveLength(1);
    });

    it('fails loudly when no cursor was ever stored', async () => {
        const store = createStore();

        await expect(runTrigger(context({ store }))).rejects.toThrow(/no saved position/);
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

describe('test', () => {
    it('reads from the start of the log and never writes the cursor', async () => {
        sendRequest.mockResolvedValueOnce(
            changesPage({ changes: [change(1), change(2)], nextSince: 2 }),
        );
        const store = createStore({ [SINCE_KEY]: 500, [FILTER_HASH_KEY]: 'hash-a' });

        const result = await segmentMembershipChangedTrigger.test(
            context({ store }) as never,
        );

        expect(sendRequest.mock.calls[0][0].queryParams).toEqual({ since: '0' });
        expect(result).toHaveLength(2);
        expect(await store.get(SINCE_KEY)).toBe(500);
    });
});
