import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, groupDropdown, directoryObjectDropdown } from '../common';

export const addMemberToGroupAction = createAction({
    auth: azureAdAuth,
    name: 'add_member_to_group',
    classification: 'WRITE',
    displayName: 'Add Member to Group',
    description: 'Adds a user or group to a Microsoft Entra ID group.',
    audience: 'both',
    aiMetadata: {
        description:
            'Adds an existing user or group (by directory object ID) as a member of a Microsoft Entra ID group. Use when granting group-based access or distribution membership; both the group and the member must already exist. Not idempotent — re-adding someone who is already a member fails with a Graph error, so check membership with List Group Members or List User Groups first if unsure. Use Remove Member from Group to undo.',
        idempotent: false,
    },
    outputSchema: {
        fields: [
            { key: 'success', label: 'Success', format: 'boolean' },
            { key: 'message', label: 'Message' },
            { key: 'group_id', label: 'Group ID' },
            { key: 'member_id', label: 'Member ID' },
        ],
    },
    props: {
        groupId: groupDropdown,
        memberId: directoryObjectDropdown,
    },
    async run(context) {
        const token = context.auth.access_token;
        const { groupId, memberId } = context.propsValue;

        await callGraphApi(token, {
            method: HttpMethod.POST,
            url: `https://graph.microsoft.com/v1.0/groups/${encodeURIComponent(String(groupId))}/members/$ref`,
            body: {
                '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${memberId}`,
            },
        });
        return { success: true, message: 'Member added to group.', group_id: groupId, member_id: memberId };
    },
});
