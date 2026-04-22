import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, groupDropdown } from '../common';

export const getGroupCustomAttributesAction = createAction({
    auth: azureAdAuth,
    name: 'get_group_custom_attributes',
    displayName: 'Get Group Custom Attributes',
    description: 'Gets extension and custom attributes for an Azure AD group. Returns schema extensions and open extensions.',
    props: {
        groupId: groupDropdown,
    },
    async run(context) {
        const token = context.auth.access_token;
        const { groupId } = context.propsValue;
        // https://learn.microsoft.com/en-us/graph/api/group-get?view=graph-rest-1.0&tabs=http
        const group = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.GET,
            url: `https://graph.microsoft.com/v1.0/groups/${groupId}`,
        });
        const out: Record<string, unknown> = {
            group_id: group['id'],
            group_displayName: group['displayName'],
        };
        for (const [key, value] of Object.entries(group)) {
            if (key.startsWith('extension_') || key.startsWith('ext_')) {
                out[key] = value;
            }
        }
        return out;
    },
});
