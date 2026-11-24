import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, dropdownErrorPlaceholder, groupDropdown, listGroupMembersForDropdown, userOptionLabel } from '../common';

export const removeMemberFromGroupAction = createAction({
    auth: azureAdAuth,
    name: 'remove_member_from_group',
    classification: 'DESTRUCTIVE',
    displayName: 'Remove Member from Group',
    description: 'Removes a user, group or device from a group\'s direct members.',
    audience: 'both',
    aiMetadata: {
        description:
            'Removes one direct member (user, group or device, by directory object ID) from a Microsoft Entra ID group. The object itself is not deleted, only the membership. Not idempotent: if the object is not a member Graph returns 404, so check with List Group Members or List User Groups when unsure. Use Add Member to Group to undo.',
        idempotent: false,
    },
    outputSchema: {
        fields: [
            { key: 'success', label: 'Success', format: 'boolean' },
            { key: 'group_id', label: 'Group ID' },
            { key: 'member_id', label: 'Member ID' },
        ],
    },
    props: {
        groupId: groupDropdown,
        memberId: Property.Dropdown({
            displayName: 'Member',
            description: 'Select a current member of the group, or type to search. You can also pass a directory object ID.',
            refreshers: ['groupId'],
            refreshOnSearch: true,
            required: true,
            auth: azureAdAuth,
            options: async ({ auth, groupId }, { searchValue }) => {
                if (!auth) return { disabled: true, options: [], placeholder: 'Connect your account first.' };
                if (typeof groupId !== 'string' || groupId === '') {
                    return { disabled: true, options: [], placeholder: 'Select a group first.' };
                }
                try {
                    const { items, truncated } = await listGroupMembersForDropdown({ accessToken: auth.access_token, groupId, search: searchValue });
                    return {
                        disabled: false,
                        options: items.map((m) => ({ label: userOptionLabel(m), value: m.id })),
                        placeholder: items.length === 0
                            ? 'This group has no matching members.'
                            : truncated ? `First ${items.length} shown. Type to filter.` : undefined,
                    };
                } catch (error) {
                    return { disabled: true, options: [], placeholder: dropdownErrorPlaceholder({ what: 'group members', error }) };
                }
            },
        }),
    },
    async run(context) {
        const groupId = String(context.propsValue.groupId ?? '').trim();
        const memberId = String(context.propsValue.memberId ?? '').trim();
        if (groupId === '' || memberId === '') {
            throw new Error('Select both the group and the member to remove.');
        }
        await callGraphApi(context.auth.access_token, {
            method: HttpMethod.DELETE,
            url: `/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}/$ref`,
        });
        return { success: true, group_id: groupId, member_id: memberId };
    },
});
