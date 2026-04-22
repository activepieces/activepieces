import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { azureAdAuth } from '../auth';
import { callGraphApi, fetchGraphDeltaChanges } from '../common';

const STORE_KEY = '_delta_link_new_updated_member';
const GROUP_MEMBERS_SELECT = 'id,displayName,members';

export const newUpdatedMemberTrigger = createTrigger({
    auth: azureAdAuth,
    name: 'new_updated_member',
    displayName: 'New/Updated Group Member',
    description:
        'Triggers when a member is added to or removed from a group in Microsoft Entra ID. One event is emitted per member change.',
    type: TriggerStrategy.POLLING,
    props: {},
    sampleData: {
        group_id: 'abcdefab-1234-5678-9abc-def012345678',
        group_display_name: 'Engineering',
        member_id: '12345678-aaaa-bbbb-cccc-1234567890ab',
        member_type: 'user',
        action: 'added',
    },
    async onEnable(context) {
        await fetchGraphDeltaChanges({
            accessToken: context.auth.access_token,
            store: context.store,
            storeKey: STORE_KEY,
            deltaPath: '/groups/delta',
            select: GROUP_MEMBERS_SELECT,
        });
    },
    async onDisable(context) {
        await context.store.delete(STORE_KEY);
    },
    async test(context) {
        const res = await callGraphApi<{ value?: GraphGroupSummary[] }>(context.auth.access_token, {
            method: HttpMethod.GET,
            url: '/groups',
            query: { $select: 'id,displayName', $top: '1' },
        });
        const group = (res.value ?? [])[0];
        if (!group) return [];
        // https://learn.microsoft.com/en-us/graph/api/group-list-members?view=graph-rest-1.0&tabs=http
        const members = await callGraphApi<{ value?: GraphMember[] }>(context.auth.access_token, {
            method: HttpMethod.GET,
            url: `/groups/${group.id}/members`,
            query: { $select: 'id', $top: '3' },
        });
        return (members.value ?? []).map((m) => buildMemberEvent(group, m, 'added'));
    },
    async run(context) {
        const groups = await fetchGraphDeltaChanges<GroupWithMemberDeltas>({
            accessToken: context.auth.access_token,
            store: context.store,
            storeKey: STORE_KEY,
            deltaPath: '/groups/delta',
            select: GROUP_MEMBERS_SELECT,
        });
        const events: MemberChangeEvent[] = [];
        for (const group of groups) {
            for (const member of group['members@delta'] ?? []) {
                const action = member['@removed'] ? 'removed' : 'added';
                events.push(buildMemberEvent(group, member, action));
            }
        }
        return events;
    },
});

function buildMemberEvent(
    group: GraphGroupSummary,
    member: GraphMember,
    action: 'added' | 'removed',
): MemberChangeEvent {
    return {
        group_id: group.id,
        group_display_name: group.displayName ?? null,
        member_id: member.id,
        member_type: resolveMemberType(member['@odata.type']),
        action,
    };
}

function resolveMemberType(odataType: string | undefined): string {
    if (!odataType) return 'unknown';
    const suffix = odataType.startsWith('#microsoft.graph.') ? odataType.slice(17) : odataType;
    return suffix || 'unknown';
}

type GraphGroupSummary = {
    id: string;
    displayName?: string | null;
};

type GraphMember = {
    id: string;
    '@odata.type'?: string;
    '@removed'?: { reason?: string } | unknown;
};

type GroupWithMemberDeltas = GraphGroupSummary & {
    'members@delta'?: GraphMember[];
    '@removed'?: unknown;
};

type MemberChangeEvent = {
    group_id: string;
    group_display_name: string | null;
    member_id: string;
    member_type: string;
    action: 'added' | 'removed';
};
