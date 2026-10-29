import { HttpMethod } from '@activepieces/pieces-common';
import { jumpcloudApi } from './client';
import { jumpcloudObjects } from './objects';
import { ApiRecord, ConnectionProps, ObjectTypeKey } from './types';

export const jumpcloudAssociations = {
    route,
    change,
    exists,
    parseEnds,
    toOutput,
};

function parseEnds({ objectType, objectId, targetType, targetId }: EndsInput): AssociationEnds {
    return {
        sourceType: jumpcloudObjects.parseType(objectType),
        sourceId: objectId.trim(),
        targetType: jumpcloudObjects.parseType(targetType),
        targetId: targetId.trim(),
    };
}

function toOutput({ ends, associated }: { ends: AssociationEnds; associated: boolean }): AssociationOutput {
    return {
        object_type: ends.sourceType,
        object_id: ends.sourceId,
        associated_type: ends.targetType,
        associated_id: ends.targetId,
        associated,
    };
}

function route({ sourceType, sourceId, targetType, targetId }: AssociationEnds): AssociationRoute {
    const membership = MEMBERSHIPS.find(
        (pair) => (pair.group === sourceType && pair.member === targetType) || (pair.group === targetType && pair.member === sourceType),
    );
    if (membership !== undefined) {
        const groupId = sourceType === membership.group ? sourceId : targetId;
        const memberId = sourceType === membership.group ? targetId : sourceId;
        return { path: `${GRAPH_PATHS[membership.group]}/${encodeURIComponent(groupId)}/members`, type: membership.member, id: memberId };
    }
    if (ASSOCIATION_TARGETS[sourceType].includes(targetType)) {
        return { path: `${GRAPH_PATHS[sourceType]}/${encodeURIComponent(sourceId)}/associations`, type: targetType, id: targetId };
    }
    const allowed = [...ASSOCIATION_TARGETS[sourceType], ...membershipPartners(sourceType)].map((type) => jumpcloudObjects.config(type).label);
    throw new Error(
        `JumpCloud cannot associate a ${jumpcloudObjects.config(sourceType).label} with a ${jumpcloudObjects.config(targetType).label}. Pick one of: ${allowed.join(', ')}.`,
    );
}

async function change({ auth, op, ends, attributes }: ChangeParams): Promise<void> {
    const sourceId = ends.sourceId.trim();
    const targetId = ends.targetId.trim();
    if (sourceId.length === 0 || targetId.length === 0) {
        throw new Error('Select both objects of the association.');
    }
    const target = route({ ...ends, sourceId, targetId });
    await jumpcloudApi.send<unknown>({
        auth,
        method: HttpMethod.POST,
        path: target.path,
        version: 'v2',
        body: { op, type: target.type, id: target.id, ...(attributes === undefined ? {} : { attributes }) },
    });
}

async function exists({ auth, ends }: { auth: ConnectionProps; ends: AssociationEnds }): Promise<boolean> {
    const target = route(ends);
    return findTarget({ auth, target, skip: 0 });
}

async function findTarget({ auth, target, skip }: { auth: ConnectionProps; target: AssociationRoute; skip: number }): Promise<boolean> {
    const body = await jumpcloudApi.send<unknown>({
        auth,
        method: HttpMethod.GET,
        path: target.path,
        version: 'v2',
        queryParams: { targets: target.type, limit: String(ASSOCIATION_PAGE_SIZE), skip: String(skip) },
    });
    const page = Array.isArray(body) ? body.filter(jumpcloudApi.isRecord) : [];
    const found = page.some((connection) => {
        const to = connection['to'];
        return jumpcloudApi.isRecord(to) && to['id'] === target.id;
    });
    if (found || page.length < ASSOCIATION_PAGE_SIZE) {
        return found;
    }
    return findTarget({ auth, target, skip: skip + page.length });
}

function membershipPartners(type: ObjectTypeKey): ObjectTypeKey[] {
    return MEMBERSHIPS.flatMap((pair) => (pair.group === type ? [pair.member] : pair.member === type ? [pair.group] : []));
}

const GRAPH_PATHS: Record<ObjectTypeKey, string> = {
    user: '/users',
    system: '/systems',
    user_group: '/usergroups',
    system_group: '/systemgroups',
    application: '/applications',
};

const ASSOCIATION_TARGETS: Record<ObjectTypeKey, ObjectTypeKey[]> = {
    user: ['system', 'system_group', 'application'],
    system: ['user', 'user_group'],
    user_group: ['system', 'system_group', 'application'],
    system_group: ['user', 'user_group'],
    application: ['user', 'user_group'],
};

const ASSOCIATION_PAGE_SIZE = 100;

const MEMBERSHIPS: { group: ObjectTypeKey; member: ObjectTypeKey }[] = [
    { group: 'user_group', member: 'user' },
    { group: 'system_group', member: 'system' },
];

type AssociationEnds = {
    sourceType: ObjectTypeKey;
    sourceId: string;
    targetType: ObjectTypeKey;
    targetId: string;
};

type EndsInput = {
    objectType: unknown;
    objectId: string;
    targetType: unknown;
    targetId: string;
};

type AssociationOutput = {
    object_type: ObjectTypeKey;
    object_id: string;
    associated_type: ObjectTypeKey;
    associated_id: string;
    associated: boolean;
};

type AssociationRoute = {
    path: string;
    type: ObjectTypeKey;
    id: string;
};

type ChangeParams = {
    auth: ConnectionProps;
    op: 'add' | 'remove' | 'update';
    ends: AssociationEnds;
    attributes?: ApiRecord;
};
