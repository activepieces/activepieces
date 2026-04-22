import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenGroup } from '../common';

export const createGroupAction = createAction({
    auth: azureAdAuth,
    name: 'create_group',
    displayName: 'Create Group',
    description: 'Creates a new group in Azure Active Directory.',
    props: {
        displayName: Property.ShortText({
            displayName: 'Display Name',
            description: 'The display name of the group.',
            required: true,
        }),
        description: Property.ShortText({
            displayName: 'Description',
            description: 'Optional description for the group.',
            required: false,
        }),
        mailNickname: Property.ShortText({
            displayName: 'Mail Nickname',
            description: 'Mail alias (e.g. "team-alpha"). Used for mail-enabled groups; must be unique.',
            required: true,
        }),
        mailEnabled: Property.Checkbox({
            displayName: 'Mail Enabled',
            description: 'Set to true for a mail-enabled security or Microsoft 365 group.',
            required: false,
            defaultValue: false,
        }),
        securityEnabled: Property.Checkbox({
            displayName: 'Security Enabled',
            description: 'Set to true for a security group.',
            required: false,
            defaultValue: true,
        }),
    },
    async run(context) {
        const token = context.auth.access_token;
        const props = context.propsValue;
        const body: Record<string, unknown> = {
            displayName: props.displayName,
            mailEnabled: props.mailEnabled ?? false,
            securityEnabled: props.securityEnabled ?? true,
        };
        if (props['description']) body['description'] = props['description'];
        body['mailNickname'] = props['mailNickname'];
        // https://learn.microsoft.com/en-us/graph/api/group-post-groups?view=graph-rest-1.0&tabs=http
        const group = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.POST,
            url: 'https://graph.microsoft.com/v1.0/groups',
            body,
        });
        return flattenGroup(group);
    },
});
