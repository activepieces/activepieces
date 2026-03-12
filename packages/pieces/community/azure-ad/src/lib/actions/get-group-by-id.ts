import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenGroup } from '../common';

export const getGroupByIdAction = createAction({
    auth: azureAdAuth,
    name: 'get_group_by_id',
    displayName: 'Get Group by ID',
    description: 'Retrieves an Azure AD group by its object ID.',
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
            url: `https://graph.microsoft.com/v1.0/groups/${groupId}`,
        });
        return flattenGroup(group);
    },
});
