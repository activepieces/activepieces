import { createTrigger, Store, TriggerStrategy } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudObjects } from '../common/objects';
import { jumpcloudOutput } from '../common/output';
import { jumpcloudProps } from '../common/props';
import { ApiRecord, ConnectionProps, ObjectTypeKey } from '../common/types';

export const newObjectTrigger = createTrigger({
    auth: jumpcloudAuth,
    name: 'new_object',
    classification: 'READ',
    displayName: 'New Object',
    description: 'Triggers when a new user, device, group or application appears in JumpCloud.',
    aiMetadata: {
        description:
            'Fires once per new JumpCloud object of the selected type (user, system/device, user group, device group or SSO application), checked every few minutes. Each run carries one object with its fields and object_type.',
    },
    props: newObjectProps(),
    sampleData: {
        object_type: 'user',
        id: '5f8a1c2b3d4e5f6a7b8c9d0e',
        username: 'jane.doe',
        email: 'jane.doe@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        display_name: 'Jane Doe',
        employee_id: 'E-1042',
        employee_type: 'Full-time',
        job_title: 'Software Engineer',
        department: 'Engineering',
        company: 'Example Inc.',
        cost_center: null,
        location: 'Remote',
        manager_id: null,
        state: 'ACTIVATED',
        activated: true,
        account_locked: false,
        suspended: false,
        password_expired: false,
        mfa_configured: false,
        totp_enabled: false,
        created: '2026-10-06T12:00:00.000Z',
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        const type = jumpcloudObjects.parseType(context.propsValue.objectType);
        const records = jumpcloudObjects.sortsByCreated(type)
            ? await jumpcloudObjects.listCreatedSince({ auth: context.auth.props, type, since: 0, maxItems: TEST_ITEMS })
            : await jumpcloudObjects.listAll({ auth: context.auth.props, type });
        return toOutputs({ type, records }).slice(0, TEST_ITEMS);
    },
    async onEnable(context) {
        const type = jumpcloudObjects.parseType(context.propsValue.objectType);
        const existing = await context.store.get<Checkpoint>(CHECKPOINT_KEY);
        if (context.isRepublish === true && existing !== null && existing.type === type) {
            return;
        }
        await context.store.put(CHECKPOINT_KEY, await initialCheckpoint({ auth: context.auth.props, type }));
    },
    async onDisable() {
        return;
    },
    async run(context) {
        const type = jumpcloudObjects.parseType(context.propsValue.objectType);
        const auth = context.auth.props;
        const checkpoint = await context.store.get<Checkpoint>(CHECKPOINT_KEY);
        if (checkpoint === null || checkpoint.type !== type) {
            await context.store.put(CHECKPOINT_KEY, await initialCheckpoint({ auth, type }));
            return [];
        }
        return poll({ auth, type, checkpoint, store: context.store });
    },
});

function newObjectProps() {
    return {
        objectType: jumpcloudProps.objectType({ description: 'The kind of new object to watch for.' }),
    };
}

async function initialCheckpoint({ auth, type }: { auth: ConnectionProps; type: ObjectTypeKey }): Promise<Checkpoint> {
    if (jumpcloudObjects.sortsByCreated(type)) {
        return { kind: 'created', type, since: Date.now(), boundaryIds: [] };
    }
    const records = await jumpcloudObjects.listAll({ auth, type });
    return { kind: 'ids', type, ids: readIds({ type, records }) };
}

async function poll({ auth, type, checkpoint, store }: PollParams): Promise<OutputItem[]> {
    if (checkpoint.kind === 'ids') {
        const records = await jumpcloudObjects.listAll({ auth, type });
        const known = new Set(checkpoint.ids);
        const created = records.filter((record) => {
            const id = jumpcloudObjects.readId({ type, record });
            return id !== null && !known.has(id);
        });
        await store.put(CHECKPOINT_KEY, { kind: 'ids', type, ids: readIds({ type, records }) });
        return toOutputs({ type, records: created });
    }
    const records = await jumpcloudObjects.listCreatedSince({ auth, type, since: checkpoint.since });
    const boundary = new Set(checkpoint.boundaryIds);
    const created = records.filter((record) => {
        const id = jumpcloudObjects.readId({ type, record });
        const at = jumpcloudObjects.createdAt({ type, record });
        return id !== null && at !== null && (at > checkpoint.since || (at === checkpoint.since && !boundary.has(id)));
    });
    await store.put(CHECKPOINT_KEY, advance({ type, checkpoint, created }));
    return toOutputs({ type, records: created });
}

function advance({ type, checkpoint, created }: { type: ObjectTypeKey; checkpoint: CreatedCheckpoint; created: ApiRecord[] }): CreatedCheckpoint {
    const since = created.reduce((latest, record) => Math.max(latest, jumpcloudObjects.createdAt({ type, record }) ?? latest), checkpoint.since);
    const atSince = readIds({ type, records: created.filter((record) => jumpcloudObjects.createdAt({ type, record }) === since) });
    const boundaryIds = since === checkpoint.since ? [...new Set([...checkpoint.boundaryIds, ...atSince])] : atSince;
    return { kind: 'created', type, since, boundaryIds };
}

function toOutputs({ type, records }: { type: ObjectTypeKey; records: ApiRecord[] }): OutputItem[] {
    return records
        .map((record) => ({ at: jumpcloudObjects.createdAt({ type, record }) ?? 0, data: { object_type: type, ...jumpcloudOutput.flatten({ type, record }) } }))
        .sort((a, b) => b.at - a.at)
        .map((item) => item.data);
}

function readIds({ type, records }: { type: ObjectTypeKey; records: ApiRecord[] }): string[] {
    return records.flatMap((record) => {
        const id = jumpcloudObjects.readId({ type, record });
        return id === null ? [] : [id];
    });
}

const CHECKPOINT_KEY = 'checkpoint';
const TEST_ITEMS = 5;

type CreatedCheckpoint = { kind: 'created'; type: ObjectTypeKey; since: number; boundaryIds: string[] };

type Checkpoint = CreatedCheckpoint | { kind: 'ids'; type: ObjectTypeKey; ids: string[] };

type OutputItem = { object_type: ObjectTypeKey } & ReturnType<typeof jumpcloudOutput.flatten>;

type PollParams = {
    auth: ConnectionProps;
    type: ObjectTypeKey;
    checkpoint: Checkpoint;
    store: Store;
};
