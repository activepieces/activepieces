import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi } from '../common';

function flattenMember(member: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(member)) {
        if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
            const obj = v as Record<string, unknown>;
            if (obj['@odata.type']) continue;
            for (const [k2, v2] of Object.entries(obj)) {
                out[`${k}_${k2}`] = v2;
            }
        } else {
            out[k] = v;
        }
    }
    return out;
}

export const listGroupMembersAction = createAction({
    auth: azureAdAuth,
    name: 'list_group_members',
    displayName: 'List Group Members',
    description: 'Lists members of an Azure AD group.',
    props: {
        groupId: Property.ShortText({
            displayName: 'Group ID',
            description: 'The object ID of the group.',
            required: true,
        }),
        top: Property.Number({
            displayName: 'Top',
            description: 'Maximum number of members to return (1–999). Default 100.',
            required: false,
            defaultValue: 100,
        }),
    },
    async run(context) {
        const token = (context.auth as { access_token: string }).access_token;
        const { groupId, top = 100 } = context.propsValue;
        const result = await callGraphApi<{ value?: Record<string, unknown>[] }>(token, {
            method: HttpMethod.GET,
            url: `https://graph.microsoft.com/v1.0/groups/${groupId}/members`,
            query: { $top: String(Math.min(999, Math.max(1, top ?? 100))) },
        });
        const list = result.value ?? [];
        return list.map((m) => flattenMember(m));
    },
});
