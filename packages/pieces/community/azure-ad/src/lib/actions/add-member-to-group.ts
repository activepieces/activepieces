import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, groupDropdown, directoryObjectDropdown } from '../common';

export const addMemberToGroupAction = createAction({
    auth: azureAdAuth,
    name: 'add_member_to_group',
    displayName: 'Add Member to Group',
    description: 'Adds a user or group as a member of an Azure AD group.',
    props: {
        groupId: groupDropdown,
        memberId: directoryObjectDropdown,
    },
    async run(context) {
        const token = context.auth.access_token;
        const { groupId, memberId } = context.propsValue;

        // https://learn.microsoft.com/en-us/graph/api/group-post-members?view=graph-rest-1.0&tabs=http
        await callGraphApi(token, {
            method: HttpMethod.POST,
            url: `https://graph.microsoft.com/v1.0/groups/${groupId}/members/$ref`,
            body: {
                '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${memberId}`,
            },
        });
        return { success: true, message: 'Member added to group.' };
    },
});
