import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenedGroupFields, flattenGroup, groupDropdown } from '../common';

export const getGroupByIdAction = createAction({
    auth: azureAdAuth,
    name: 'get_group_by_id',
    classification: 'READ',
    displayName: 'Get Group by ID',
    description: 'Gets a Microsoft Entra ID group by its ID.',
    audience: 'both',
    aiMetadata: {
        description:
            'Retrieves one Microsoft Entra ID group profile (name, description, mail settings, security flags) by its object ID. Read-only and idempotent; use it to confirm a group exists or inspect it before membership changes or deletion. For extension attributes, use Get Group Custom Attributes instead.',
        idempotent: true,
    },
    outputSchema: { fields: flattenedGroupFields },
    props: {
        groupId: groupDropdown,
    },
    async run(context) {
        const token = context.auth.access_token;
        const { groupId } = context.propsValue;
        const group = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.GET,
            url: `https://graph.microsoft.com/v1.0/groups/${encodeURIComponent(String(groupId))}`,
        });
        return flattenGroup(group);
    },
});
