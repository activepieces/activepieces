import { createAction, Property } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudApi, MAX_PAGE_SIZE } from '../common/client';
import { jumpcloudObjects } from '../common/objects';
import { jumpcloudOutput } from '../common/output';
import { jumpcloudProps } from '../common/props';
import { ApiRecord, ConnectionProps, ObjectTypeKey } from '../common/types';

export const listObjectsByIdAction = createAction({
    auth: jumpcloudAuth,
    name: 'list_objects_by_id',
    classification: 'READ',
    displayName: 'List Objects by ID (Batch)',
    description: 'Get many users, devices, groups or applications at once from a list of IDs.',
    audience: 'both',
    aiMetadata: {
        description:
            'Fetches JumpCloud objects of one type for a list of IDs and returns them in the order given, plus missing_ids for IDs that were not found. Pages over the ID list with Max Results / Skip. Use Get Object by ID for a single object. Safe to retry.',
        idempotent: true,
    },
    props: {
        objectType: jumpcloudProps.objectType(),
        ids: Property.Array({
            displayName: 'Object IDs',
            description: 'The IDs to fetch. Map a list from an earlier step or add them one by one. Duplicates are ignored.',
            required: true,
        }),
        ...jumpcloudProps.pagination(),
    },
    async run(context) {
        const auth = context.auth.props;
        const { limit, skip, fetchAll, maxItems } = context.propsValue;
        const type = jumpcloudObjects.parseType(context.propsValue.objectType);
        const ids = normalizeIds(context.propsValue.ids);
        if (ids.length === 0) {
            throw new Error('Add at least one Object ID.');
        }
        const { start, count } = jumpcloudApi.pageWindow({ limit, skip, fetchAll, maxItems });
        const requested = ids.slice(start, start + count);
        const records = await fetchInChunks({ auth, type, ids: requested });
        const byId = new Map(
            records.flatMap((record): [string, ApiRecord][] => {
                const id = jumpcloudObjects.readId({ type, record });
                return id === null ? [] : [[id, record]];
            }),
        );
        const end = start + requested.length;
        return {
            items: requested.flatMap((id) => {
                const record = byId.get(id);
                return record === undefined ? [] : [jumpcloudOutput.flatten({ type, record })];
            }),
            missing_ids: requested.filter((id) => !byId.has(id)),
            total_count: ids.length,
            next_skip: end < ids.length ? end : null,
        };
    },
});

function normalizeIds(value: unknown): string[] {
    const list = Array.isArray(value) ? value : [value];
    const ids = list.flatMap((item) => (typeof item === 'string' || typeof item === 'number' ? [String(item).trim()] : []));
    return [...new Set(ids.filter((id) => id.length > 0))];
}

async function fetchInChunks({ auth, type, ids }: { auth: ConnectionProps; type: ObjectTypeKey; ids: string[] }): Promise<ApiRecord[]> {
    const chunks = Array.from({ length: Math.ceil(ids.length / MAX_PAGE_SIZE) }, (_, index) =>
        ids.slice(index * MAX_PAGE_SIZE, (index + 1) * MAX_PAGE_SIZE),
    );
    return chunks.reduce<Promise<ApiRecord[]>>(async (previous, chunk) => {
        const collected = await previous;
        return [...collected, ...(await jumpcloudObjects.listByIds({ auth, type, ids: chunk }))];
    }, Promise.resolve([]));
}
