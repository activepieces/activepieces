import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi } from '../common';

export const getGroupCustomAttributesAction = createAction({
    auth: azureAdAuth,
    name: 'get_group_custom_attributes',
    displayName: 'Get Group Custom Attributes',
    description: 'Gets extension and custom attributes for an Azure AD group. Returns schema extensions and open extensions.',
    props: {
        groupId: Property.ShortText({
            displayName: 'Group ID',
            description: 'The object ID of the group.',
            required: true,
        }),
    },
    async run(context) {
        const token = (context.auth as { access_token: string }).access_token;
        const { groupId } = context.propsValue;
        const group = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.GET,
            url: `https://graph.microsoft.com/v1.0/groups/${groupId}?$select=id,displayName,description`,
        });
        const extensions: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(group)) {
            if (key.startsWith('extension_') || key.startsWith('ext_')) {
                extensions[key] = value;
            }
        }
        return {
            group_id: group['id'],
            group_displayName: group['displayName'],
            custom_attributes: extensions,
        };
    },
});
