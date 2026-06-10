import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenGroup, groupDropdown } from '../common';

export const getGroupByIdAction = createAction({
    auth: azureAdAuth,
    name: 'get_group_by_id',
    displayName: 'Get Group by ID',
    description: 'Retrieves an Azure AD group by its object ID.',
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
