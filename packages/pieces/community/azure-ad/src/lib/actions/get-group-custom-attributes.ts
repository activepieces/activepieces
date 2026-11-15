import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, fetchExtensionPropertyNames, groupDropdown } from '../common';

export const getGroupCustomAttributesAction = createAction({
    auth: azureAdAuth,
    name: 'get_group_custom_attributes',
    classification: 'READ',
    displayName: 'Get Group Custom Attributes',
    description: 'Gets the directory extension attributes (extension_*) registered for groups, with their values on one group.',
    audience: 'both',
    aiMetadata: {
        description:
            'Reads the directory extension attributes (extension_<appId>_<name>) of one Microsoft Entra ID group, plus its ID and display name. Discovers every extension property registered for groups in the tenant and requests them explicitly, because Graph omits them by default; attributes with no value come back as null. Read-only and idempotent. Use Get Group by ID for the standard group profile.',
        idempotent: true,
    },
    outputSchema: {
        fields: [
            { key: 'group_id', label: 'Group ID' },
            { key: 'group_displayName', label: 'Group Display Name' },
            { key: 'extension_attribute_names', label: 'Extension Attribute Names', description: 'Comma-separated names of every extension attribute registered for groups; each one is also a top-level key holding its value.' },
        ],
    },
    props: {
        groupId: groupDropdown,
    },
    async run(context) {
        const token = context.auth.access_token;
        const { groupId } = context.propsValue;
        const names = await fetchExtensionPropertyNames({ accessToken: token, targetObject: 'Group' });
        const group = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.GET,
            url: `/groups/${encodeURIComponent(String(groupId))}`,
            query: { $select: ['id', 'displayName', ...names].join(',') },
        });
        const out: Record<string, unknown> = {
            group_id: group['id'],
            group_displayName: group['displayName'],
            extension_attribute_names: names.join(', '),
        };
        for (const name of names) {
            out[name] = group[name] ?? null;
        }
        return out;
    },
});
