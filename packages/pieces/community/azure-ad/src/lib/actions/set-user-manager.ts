import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, GRAPH_BASE, userDropdown } from '../common';

export const setUserManagerAction = createAction({
    auth: azureAdAuth,
    name: 'set_user_manager',
    classification: 'WRITE',
    displayName: 'Set User Manager',
    description: 'Sets or replaces the manager of a user.',
    audience: 'both',
    aiMetadata: {
        description:
            'Sets the manager of one Microsoft Entra ID user to another user, replacing any existing manager. Both are user object IDs or user principal names; a user cannot be their own manager. Idempotent: setting the same manager again leaves the same state. Returns user_id and manager_id.',
        idempotent: true,
    },
    outputSchema: {
        fields: [
            { key: 'success', label: 'Success', format: 'boolean' },
            { key: 'user_id', label: 'User ID' },
            { key: 'manager_id', label: 'Manager ID' },
        ],
    },
    props: {
        userId: userDropdown,
        managerId: {
            ...userDropdown,
            displayName: 'Manager',
            description: 'Select the user who becomes the manager, or type to search. You can also pass a user object ID or UPN.',
        },
    },
    async run(context) {
        const userId = String(context.propsValue.userId ?? '').trim();
        const managerId = String(context.propsValue.managerId ?? '').trim();
        if (userId === '' || managerId === '') {
            throw new Error('Select both the user and the manager.');
        }
        if (userId.toLowerCase() === managerId.toLowerCase()) {
            throw new Error('A user cannot be their own manager.');
        }
        await callGraphApi(context.auth.access_token, {
            method: HttpMethod.PUT,
            url: `/users/${encodeURIComponent(userId)}/manager/$ref`,
            body: { '@odata.id': `${GRAPH_BASE}/users/${encodeURIComponent(managerId)}` },
        });
        return { success: true, user_id: userId, manager_id: managerId };
    },
});
