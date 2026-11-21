import { createAction, Property } from '@activepieces/pieces-framework';
import { azureAdAuth } from '../auth';
import { clampLimit, escapeODataString, fetchGraphPage, GROUP_ITEM_SELECT, groupItemFields, pagingFields } from '../common';

export const listGroupsAction = createAction({
    auth: azureAdAuth,
    name: 'list_groups',
    classification: 'SEARCH',
    displayName: 'List Groups',
    description: 'Lists groups, optionally those whose name starts with some text, one page at a time.',
    audience: 'both',
    aiMetadata: {
        description:
            'Lists Microsoft Entra ID groups and returns one page as {items, next_cursor, has_more}. name matches the start of displayName or mail (case-insensitive); leave it empty to list all groups. limit is 1-100 (default 25). For the next page pass next_cursor as cursor; other inputs are ignored when cursor is set. Each item has id, displayName, description, mail, mailNickname, mailEnabled, securityEnabled, groupTypes ("Unified" = Microsoft 365 group), visibility, createdDateTime. Use the id with the group tools. Read-only and idempotent.',
        idempotent: true,
    },
    outputSchema: {
        fields: [
            { key: 'items', label: 'Groups', labelKey: 'displayName', listItems: groupItemFields },
            ...pagingFields,
        ],
    },
    props: {
        name: Property.ShortText({
            displayName: 'Name Starts With',
            description: 'Start of the group display name or email. Leave empty to list all groups.',
            required: false,
            placeholder: 'Finance',
        }),
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
        const { name, cursor } = context.propsValue;
        const query: Record<string, string> = {
            $select: GROUP_ITEM_SELECT,
            $top: String(clampLimit({ value: context.propsValue.limit, max: 100, fallback: 25 })),
        };
        const term = typeof name === 'string' ? name.trim() : '';
        if (term !== '') {
            const v = escapeODataString(term);
            query['$filter'] = `startswith(displayName,'${v}') or startswith(mail,'${v}')`;
            query['$count'] = 'true';
        }
        return fetchGraphPage<Record<string, unknown>>({
            accessToken: context.auth.access_token,
            url: '/groups',
            query,
            headers: { ConsistencyLevel: 'eventual' },
            cursor: cursor ?? undefined,
        });
    },
});
