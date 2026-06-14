import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenGroup, groupDropdown } from '../common';

export const getGroupByIdAction = createAction({
    auth: azureAdAuth,
    name: 'get_group_by_id',
    displayName: 'Get Group by ID',
    description: 'Retrieves an Azure AD group by its object ID.',
    audience: 'both',
    aiMetadata: {
        description:
            'Retrieves one Azure AD group profile (name, description, mail settings, security flags) by its object ID. Read-only and idempotent; use it to confirm a group exists or inspect it before membership changes or deletion. For extension attributes, use Get Group Custom Attributes instead.',
        idempotent: true,
    },
    props: {
        groupId: groupDropdown,
    },
    async run(context) {
        const token = context.auth.access_token;
        const { groupId } = context.propsValue;
        // https://learn.microsoft.com/en-us/graph/api/group-get?view=graph-rest-1.0&tabs=http
        const group = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.GET,
            url: `https://graph.microsoft.com/v1.0/groups/${groupId}`,
        });
        return flattenGroup(group);
    },
});
