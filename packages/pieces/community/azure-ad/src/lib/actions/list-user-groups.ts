import { createAction, Property } from '@activepieces/pieces-framework';
import { azureAdAuth } from '../auth';
import { clampLimit, fetchGraphPage, GROUP_ITEM_SELECT, groupItemFields, pagingFields, userDropdown } from '../common';

export const listUserGroupsAction = createAction({
    auth: azureAdAuth,
    name: 'list_user_groups',
    classification: 'READ',
    displayName: 'List User Groups',
    description: 'Lists the groups a user is a direct member of, one page at a time.',
    audience: 'both',
    aiMetadata: {
        description:
            'Lists the groups one user is a direct member of (nested groups are not expanded; roles and administrative units are excluded) and returns one page as {items, next_cursor, has_more}. userId is the user object ID or user principal name. limit is 1-100 (default 25); pass next_cursor as cursor for the next page. Use it to check membership before Add Member to Group or Remove Member from Group. Read-only and idempotent.',
        idempotent: true,
    },
    outputSchema: {
        fields: [
            { key: 'items', label: 'Groups', labelKey: 'displayName', listItems: groupItemFields },
            ...pagingFields,
        ],
    },
    props: {
        userId: userDropdown,
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Groups per page. Default 25, max 100.',
            required: false,
            defaultValue: 25,
            advanced: true,
        }),
        cursor: Property.ShortText({
            displayName: 'Cursor',
            description: 'Next Cursor from a previous run, to get the next page.',
            required: false,
            advanced: true,
        }),
    },
    async run(context) {
        const { userId, cursor } = context.propsValue;
        const id = String(userId ?? '').trim();
        if (id === '') throw new Error('Select the user whose groups should be listed.');
        return fetchGraphPage<Record<string, unknown>>({
            accessToken: context.auth.access_token,
            url: `/users/${encodeURIComponent(id)}/memberOf/microsoft.graph.group`,
            query: {
                $select: GROUP_ITEM_SELECT,
                $top: String(clampLimit({ value: context.propsValue.limit, max: 100, fallback: 25 })),
            },
            cursor: cursor ?? undefined,
        });
    },
});
