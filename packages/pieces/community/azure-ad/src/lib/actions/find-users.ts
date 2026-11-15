import { createAction, Property } from '@activepieces/pieces-framework';
import { azureAdAuth } from '../auth';
import { clampLimit, escapeODataString, fetchGraphPage, pagingFields, USER_ITEM_SELECT, userItemFields } from '../common';

export const findUsersAction = createAction({
    auth: azureAdAuth,
    name: 'find_users',
    classification: 'SEARCH',
    displayName: 'Find Users',
    description: 'Finds users by exact email or UPN, by name prefix, and by enabled state, one page at a time.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Searches Microsoft Entra ID users and returns one page as {items, next_cursor, has_more}. email matches exactly against mail, userPrincipalName or otherMails (case-insensitive). name matches the start of displayName, givenName or surname. enabled is "any" (default), "yes" or "no". Filters combine with AND; with no filters it lists all users. limit is 1-100 (default 25). To get the next page pass next_cursor as cursor and keep the other inputs; when cursor is set the filters are ignored because the cursor already carries them. Each item has id, displayName, userPrincipalName, mail, givenName, surname, jobTitle, department, accountEnabled, createdDateTime; use the id with the other user tools. Read-only and idempotent.',
        idempotent: true,
    },
    outputSchema: {
        fields: [
            { key: 'items', label: 'Users', labelKey: 'displayName', listItems: userItemFields },
            ...pagingFields,
        ],
    },
    props: {
        email: Property.ShortText({
            displayName: 'Email or UPN',
            description: 'Exact email address or user principal name.',
            required: false,
            placeholder: 'ada@contoso.com',
        }),
        name: Property.ShortText({
            displayName: 'Name Starts With',
            description: 'Start of the display name, given name or surname.',
            required: false,
            placeholder: 'Ada',
        }),
        enabled: Property.StaticDropdown({
            displayName: 'Account State',
            required: false,
            defaultValue: 'any',
            options: {
                disabled: false,
                options: [
                    { label: 'Any', value: 'any' },
                    { label: 'Enabled only', value: 'yes' },
                    { label: 'Disabled only', value: 'no' },
                ],
            },
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Users per page. Default 25, max 100.',
            required: false,
            defaultValue: 25,
        }),
        cursor: Property.ShortText({
            displayName: 'Cursor',
            description: 'next_cursor from a previous call, to get the next page.',
            required: false,
        }),
    },
    async run(context) {
        const { email, name, enabled, cursor } = context.propsValue;
        const filter = buildFindUsersFilter({ email, name, enabled });
        const query: Record<string, string> = {
            $select: USER_ITEM_SELECT,
            $top: String(clampLimit({ value: context.propsValue.limit, max: 100, fallback: 25 })),
        };
        if (filter !== undefined) {
            query['$filter'] = filter;
            query['$count'] = 'true';
        }
        return fetchGraphPage<Record<string, unknown>>({
            accessToken: context.auth.access_token,
            url: '/users',
            query,
            headers: { ConsistencyLevel: 'eventual' },
            cursor: cursor ?? undefined,
        });
    },
});

export function buildFindUsersFilter({
    email,
    name,
    enabled,
}: {
    email?: string | null;
    name?: string | null;
    enabled?: string | null;
}): string | undefined {
    const clauses: string[] = [];
    const e = typeof email === 'string' ? email.trim() : '';
    if (e !== '') {
        const v = escapeODataString(e);
        clauses.push(`(mail eq '${v}' or userPrincipalName eq '${v}' or otherMails/any(m:m eq '${v}'))`);
    }
    const n = typeof name === 'string' ? name.trim() : '';
    if (n !== '') {
        const v = escapeODataString(n);
        clauses.push(`(startswith(displayName,'${v}') or startswith(givenName,'${v}') or startswith(surname,'${v}'))`);
    }
    if (enabled === 'yes') clauses.push('accountEnabled eq true');
    else if (enabled === 'no') clauses.push('accountEnabled eq false');
    else if (enabled !== undefined && enabled !== null && enabled !== '' && enabled !== 'any') {
        throw new Error('Account State must be "any", "yes" or "no".');
    }
    return clauses.length === 0 ? undefined : clauses.join(' and ');
}
