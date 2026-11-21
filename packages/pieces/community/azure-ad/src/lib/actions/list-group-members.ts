import { createAction, Property } from '@activepieces/pieces-framework';
import { azureAdAuth } from '../auth';
import { clampLimit, fetchAllGraphPages, fetchGraphPage, flattenObject, groupDropdown } from '../common';

const MAX_PAGES = 50;

export const listGroupMembersAction = createAction({
    auth: azureAdAuth,
    name: 'list_group_members',
    classification: 'SEARCH',
    displayName: 'List Group Members',
    description: 'Lists the direct members of a group. Returns the first page unless All Pages is on.',
    audience: 'both',
    aiMetadata: {
        description:
            `Lists the direct members (users, groups, devices) of a Microsoft Entra ID group. By default returns only the first page of up to Top entries; set allPages to true to follow every page (fails if more than ${MAX_PAGES} pages). Read-only and idempotent. Does not expand nested group membership. Use List User Groups for the reverse lookup (which groups a user is in).`,
        idempotent: true,
    },
    outputSchema: {
        itemLabel: '{displayName}',
        fields: [
            {
                key: 'members',
                label: 'Members',
                value: '',
                listItems: [
                    { key: 'id', label: 'Member ID' },
                    { key: 'objectType', label: 'Object Type' },
                    { key: 'displayName', label: 'Display Name' },
                    { key: 'userPrincipalName', label: 'User Principal Name', format: 'email' },
                    { key: 'mail', label: 'Mail', format: 'email' },
                    { key: 'jobTitle', label: 'Job Title' },
                    { key: 'givenName', label: 'Given Name' },
                    { key: 'surname', label: 'Surname' },
                ],
            },
        ],
    },
    props: {
        groupId: groupDropdown,
        top: Property.Number({
            displayName: 'Top',
            description: 'Members per page. Default 100, max 999.',
            required: false,
            defaultValue: 100,
            advanced: true,
        }),
        allPages: Property.Checkbox({
            displayName: 'All Pages',
            description: `Follow every page of members (up to ${MAX_PAGES} pages) instead of returning only the first.`,
            required: false,
            defaultValue: false,
            advanced: true,
        }),
    },
    async run(context) {
        const token = context.auth.access_token;
        const { groupId, allPages } = context.propsValue;
        const top = clampLimit({ value: context.propsValue.top, max: 999, fallback: 100 });
        const url = `/groups/${encodeURIComponent(String(groupId))}/members`;
        const query = { $top: String(top) };
        const members = allPages === true
            ? await fetchAllGraphPages<Record<string, unknown>>({
                accessToken: token,
                url,
                query,
                maxPages: MAX_PAGES,
                tooManyMessage: `The group has more than ${MAX_PAGES} pages of ${top} members. Raise Top (max 999).`,
            })
            : (await fetchGraphPage<Record<string, unknown>>({ accessToken: token, url, query })).items;
        return members.map((m) => ({ ...flattenObject(m), objectType: memberObjectType(m['@odata.type']) }));
    },
});

function memberObjectType(value: unknown): string | null {
    return typeof value === 'string' && value !== '' ? value.replace(/^#microsoft\.graph\./, '') : null;
}
