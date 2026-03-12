import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi } from '../common';

export const addMemberToGroupAction = createAction({
    auth: azureAdAuth,
    name: 'add_member_to_group',
    displayName: 'Add Member to Group',
    description: 'Adds a user or group as a member of an Azure AD group.',
    props: {
        groupId: Property.ShortText({
            displayName: 'Group ID',
            description: 'The object ID of the group. Find it in Azure Portal under the group\'s Overview.',
            required: true,
        }),
        memberId: Property.ShortText({
            displayName: 'Member ID',
            description: 'The object ID of the user or group to add as a member.',
            required: true,
        }),
    },
    async run(context) {
        const token = (context.auth as { access_token: string }).access_token;
        const { groupId, memberId } = context.propsValue;
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
