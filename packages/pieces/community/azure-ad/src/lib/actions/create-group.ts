import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenedGroupFields, flattenGroup } from '../common';

export const createGroupAction = createAction({
    auth: azureAdAuth,
    name: 'create_group',
    classification: 'WRITE',
    displayName: 'Create Group',
    description: 'Creates a new group in Microsoft Entra ID.',
    audience: 'both',
    aiMetadata: {
        description:
            'Creates a new Microsoft Entra ID security or Microsoft 365 group with a display name and a unique mail nickname (groupType "microsoft365" creates a Microsoft 365 group with mail enabled; "security" creates a security group (security enabled, mail disabled); empty uses the mailEnabled/securityEnabled flags). Use only when provisioning a fresh group, not to modify an existing one. Not idempotent — display names are not unique, so repeating the call can create duplicate groups.',
        idempotent: false,
    },
    outputSchema: { fields: flattenedGroupFields },
    props: {
        displayName: Property.ShortText({
            displayName: 'Display Name',
            description: 'The display name of the group.',
            required: true,
            placeholder: 'e.g. Finance Team',
        }),
        mailNickname: Property.ShortText({
            displayName: 'Mail Nickname',
            description: 'Unique mail alias, without the domain.',
            required: true,
            placeholder: 'e.g. finance-team',
        }),
        description: Property.ShortText({
            displayName: 'Description',
            description: 'Optional description for the group.',
            required: false,
            placeholder: 'e.g. Members of the finance team',
        }),
        groupType: Property.StaticDropdown({
            displayName: 'Group Type',
            description: 'Leave empty to use the Mail/Security Enabled options.',
            required: false,
            display: 'cards',
            options: {
                disabled: false,
                options: [
                    { label: 'Security', value: 'security', description: 'Apps and resource access' },
                    { label: 'Microsoft 365', value: 'microsoft365', description: 'Mail, calendar, files, Teams' },
                ],
            },
        }),
        mailEnabled: Property.Checkbox({
            displayName: 'Mail Enabled',
            description: 'Set to true for a mail-enabled security or Microsoft 365 group.',
            required: false,
            defaultValue: false,
            advanced: true,
        }),
        securityEnabled: Property.Checkbox({
            displayName: 'Security Enabled',
            description: 'Set to true for a security group.',
            required: false,
            defaultValue: true,
            advanced: true,
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
        if (props.groupType === 'microsoft365') {
            body['groupTypes'] = ['Unified'];
            body['mailEnabled'] = true;
            body['securityEnabled'] = false;
        } else if (props.groupType === 'security') {
            body['mailEnabled'] = false;
            body['securityEnabled'] = true;
        } else if (props.groupType !== undefined && props.groupType !== null && props.groupType !== '') {
            throw new Error('Group Type must be "security" or "microsoft365".');
        }
        if (props['description']) body['description'] = props['description'];
        body['mailNickname'] = props['mailNickname'];
        const group = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.POST,
            url: 'https://graph.microsoft.com/v1.0/groups',
            body,
        });
        return flattenGroup(group);
    },
});
