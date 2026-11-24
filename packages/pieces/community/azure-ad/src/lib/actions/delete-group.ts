import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, groupDropdown } from '../common';

export const deleteGroupAction = createAction({
    auth: azureAdAuth,
    name: 'delete_group',
    classification: 'DESTRUCTIVE',
    displayName: 'Delete Group',
    description: 'Deletes a group from Microsoft Entra ID.',
    audience: 'both',
    aiMetadata: {
        description:
            'Permanently deletes a Microsoft Entra ID group by its object ID, removing its memberships with it. Destructive and not idempotent — a repeat call fails with 404 once the group is gone, so confirm the target with Get Group by ID before deleting.',
        idempotent: false,
    },
    outputSchema: {
        fields: [
            { key: 'success', label: 'Success', format: 'boolean' },
            { key: 'message', label: 'Message' },
            { key: 'id', label: 'Deleted Group ID' },
        ],
    },
    props: {
        groupId: groupDropdown,
    },
    async run(context) {
        const token = context.auth.access_token;
        const { groupId } = context.propsValue;
        await callGraphApi(token, {
            method: HttpMethod.DELETE,
            url: `https://graph.microsoft.com/v1.0/groups/${encodeURIComponent(String(groupId))}`,
        });
        return { success: true, message: 'Group deleted.', id: groupId };
    },
});
