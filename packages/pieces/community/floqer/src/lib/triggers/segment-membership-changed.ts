import { HttpMethod } from '@activepieces/pieces-common';
import {
    createTrigger,
    DEDUPE_KEY_PROPERTY,
    Store,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { floqerAuth } from '../auth';
import { floqerApi } from '../common/client';
import { segmentChangeOutputSchema } from '../common/output-schemas';
import { floqerProps } from '../common/props';
import { FloqerSegmentChange, FloqerSegmentChanges } from '../common/types';

export const segmentMembershipChangedTrigger = createTrigger({
    auth: floqerAuth,
    name: 'segment_membership_changed',
    displayName: 'Segment Membership Changed',
    description:
        'Fires when a company or contact enters, exits, or re-enters a Floqer segment.',
    type: TriggerStrategy.POLLING,
    outputSchema: segmentChangeOutputSchema,
    props: {
        segmentId: floqerProps.segmentId(),
    },
    sampleData: {
        seq: 4211,
        entityId: '01J9Z8Q3K2X7M4N5P6R7S8T9V0',
        kind: 'enter',
        at: '2026-09-09T10:15:00.000Z',
        segmentId: '01J9Z8Q3K2X7M4N5P6R7S8T9V0',
    },
    async onEnable({ auth, propsValue, store, isRepublish }) {
        const existing = await store.get<number>(SINCE_KEY);
        if (isRepublish === true && existing !== null) {
            return;
        }

        const response = await fetchChanges({
            apiKey: auth.secret_text,
            segmentId: propsValue.segmentId,
            since: 0,
        });

        await store.put(SINCE_KEY, response.nextSince);
        await store.put(FILTER_HASH_KEY, response.filterHash);
    },
    async onDisable({ store }) {
        await store.delete(SINCE_KEY);
        await store.delete(FILTER_HASH_KEY);
    },
    async run({ auth, propsValue, store }) {
        const storedSince = await store.get<number>(SINCE_KEY);
        if (storedSince === null) {
            throw new Error(
                `This trigger has no saved position for Floqer segment ${propsValue.segmentId}. Disable and re-enable it to start watching from the segment's current membership.`,
            );
        }

        return pollChanges({
            apiKey: auth.secret_text,
            segmentId: propsValue.segmentId,
            store,
            storedSince,
            storedFilterHash: await store.get<string | null>(FILTER_HASH_KEY),
        });
    },
    async test({ auth, propsValue }) {
        const response = await fetchChanges({
            apiKey: auth.secret_text,
            segmentId: propsValue.segmentId,
            since: 0,
        });
        return response.changes
            .slice(0, TEST_SAMPLE_SIZE)
            .map((change) => toPayload({ change, segmentId: response.segmentId }));
    },
});

async function pollChanges({
    apiKey,
    segmentId,
    store,
    storedSince,
    storedFilterHash,
}: {
    apiKey: string;
    segmentId: string;
    store: Store;
    storedSince: number;
    storedFilterHash: string | null;
}): Promise<unknown[]> {
    const collected: unknown[] = [];
    let since = storedSince;
    let knownFilterHash = storedFilterHash;

    for (let page = 0; page < MAX_PAGES_PER_TICK; page++) {
        let response: FloqerSegmentChanges;
        try {
            response = await fetchChanges({ apiKey, segmentId, since });
        } catch (error) {
            if (floqerApi.statusOf(error) === 409) {
                return collected;
            }
            if (floqerApi.statusOf(error) === 410) {
                throw reconcileError({ segmentId, reason: 'cursor_expired' });
            }
            if (floqerApi.statusOf(error) === 503) {
                throw new Error(
                    `Floqer has not enabled segment sync for this workspace yet, so "Segment Membership Changed" cannot run. Ask Floqer to provision segment sync for your tenant. (${floqerApi.describe(
                        error,
                        'SYNC_TABLES_UNAVAILABLE',
                    )})`,
                );
            }
            throw error;
        }

        if (response.reconcile === true) {
            throw reconcileError({ segmentId, reason: response.reason ?? 'cursor_ahead' });
        }

        if (hasFilterChanged({ known: knownFilterHash, current: response.filterHash })) {
            throw reconcileError({ segmentId, reason: 'filter_changed' });
        }

        collected.push(
            ...response.changes
                .filter((change) => change.seq > since)
                .map((change) => toPayload({ change, segmentId: response.segmentId })),
        );

        const cursorAdvanced = response.nextSince > since;

        since = response.nextSince;
        knownFilterHash = response.filterHash;
        await store.put(SINCE_KEY, since);
        await store.put(FILTER_HASH_KEY, knownFilterHash);

        if (!response.hasMore || !cursorAdvanced) {
            break;
        }
    }

    return collected;
}

async function fetchChanges({
    apiKey,
    segmentId,
    since,
}: {
    apiKey: string;
    segmentId: string;
    since: number;
}): Promise<FloqerSegmentChanges> {
    return floqerApi.bare<FloqerSegmentChanges>({
        apiKey,
        method: HttpMethod.POST,
        path: `/api/v1/ackdb/observe/segments/${segmentId}/changes`,
        queryParams: { since: String(since) },
    });
}

function hasFilterChanged({
    known,
    current,
}: {
    known: string | null;
    current: string | null;
}): boolean {
    if (known === null || current === null) {
        return false;
    }
    return known !== current;
}

function reconcileError({ segmentId, reason }: { segmentId: string; reason: string }): Error {
    return new Error(
        `Floqer segment ${segmentId} must be re-synced before this trigger can continue (${reason}). Disable and re-enable this trigger to resume from the segment's current membership. Changes that happened in the meantime will not be replayed.`,
    );
}

function toPayload({
    change,
    segmentId,
}: {
    change: FloqerSegmentChange;
    segmentId: string;
}): Record<string, unknown> {
    return {
        ...change,
        segmentId,
        [DEDUPE_KEY_PROPERTY]: `${segmentId}:${change.seq}`,
    };
}

const SINCE_KEY = 'floqer_segment_since';
const FILTER_HASH_KEY = 'floqer_segment_filter_hash';
const MAX_PAGES_PER_TICK = 20;
const TEST_SAMPLE_SIZE = 5;
