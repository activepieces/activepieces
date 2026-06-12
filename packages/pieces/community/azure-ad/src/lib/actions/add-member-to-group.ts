import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, groupDropdown, directoryObjectDropdown } from '../common';

export const addMemberToGroupAction = createAction({
    auth: azureAdAuth,
    name: 'add_member_to_group',
    displayName: 'Add Member to Group',
    description: 'Adds a user or group as a member of an Azure AD group.',
    audience: 'both',
    aiMetadata: {
        description:
            'Adds an existing user or group (by directory object ID) as a member of an Azure AD group. Use when granting group-based access or distribution membership; both the group and the member must already exist. Not idempotent — re-adding someone who is already a member fails with a Graph error, so check membership with List Group Members first if unsure.',
        idempotent: false,
    },
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
