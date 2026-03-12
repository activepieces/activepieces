import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenObject, groupDropdown } from '../common';

export const listGroupMembersAction = createAction({
    auth: azureAdAuth,
    name: 'list_group_members',
    displayName: 'List Group Members',
    description: 'Lists members of an Azure AD group.',
    props: {
        groupId: groupDropdown,
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
        return list.map((m) => flattenObject(m as Record<string, unknown>));
    },
});
