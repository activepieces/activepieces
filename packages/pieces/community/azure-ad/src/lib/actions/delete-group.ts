import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, groupDropdown } from '../common';

export const deleteGroupAction = createAction({
    auth: azureAdAuth,
    name: 'delete_group',
    displayName: 'Delete Group',
    description: 'Deletes an Azure AD group by ID.',
    props: {
        groupId: groupDropdown,
    },
    async run(context) {
        const token = context.auth.access_token;
        const { groupId } = context.propsValue;
        // https://learn.microsoft.com/en-us/graph/api/group-delete?view=graph-rest-1.0&tabs=http
        await callGraphApi(token, {
            method: HttpMethod.DELETE,
            url: `https://graph.microsoft.com/v1.0/groups/${groupId}`,
        });
        return { success: true, message: 'Group deleted.' };
    },
});
