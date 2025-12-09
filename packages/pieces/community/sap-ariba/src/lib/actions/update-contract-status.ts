import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sapAribaAuth } from '../auth';
import { sapAribaCommon } from '../common';

export const updateContractStatus = createAction({
    auth: sapAribaAuth,
    name: 'update_contract_status',
    displayName: 'Update Contract Status',
    description: 'Change the status of a contract workspace (e.g., amend, putOnHold, resume, close).',
    props: {
        realm: Property.ShortText({
            displayName: 'Realm',
            description: 'Unique identifier of the realm.',
            required: true,
        }),
        user: Property.ShortText({
            displayName: 'User',
            description: 'User ID to perform the action on behalf of.',
            required: true,
        }),
        passwordAdapter: Property.ShortText({
            displayName: 'Password Adapter',
            description: 'Password adapter to authenticate the user.',
            required: true,
        }),
        contractId: Property.ShortText({
            displayName: 'Contract ID',
            description: 'The ID of the contract workspace.',
            required: true,
        }),
        action: Property.StaticDropdown({
            displayName: 'Action',
            description: 'The status change action to perform.',
            required: true,
            options: {
                disabled: false,
                options: [
                    { label: 'Amend', value: 'amend' },
                    { label: 'Complete Amendment', value: 'completeAmendment' },
                    { label: 'Put on Hold', value: 'putOnHold' },
                    { label: 'Resume', value: 'resume' },
                    { label: 'Close', value: 'close' },
                ],
            },
        }),
        amendmentType: Property.StaticDropdown({
            displayName: 'Amendment Type',
            description: 'Required if action is Amend.',
            required: false,
            options: {
                disabled: false,
                options: [
                    { label: 'Administrative', value: 'Administrative' },
                    { label: 'Renewal', value: 'Renewal' },
                    { label: 'Amendment', value: 'Amendment' },
                    { label: 'Termination', value: 'Termination' },
                    { label: 'Price Update', value: 'PriceUpdate' },
                ],
            },
        }),
        amendmentReason: Property.LongText({
            displayName: 'Amendment Reason',
            description: 'Reason for the amendment.',
            required: false,
        }),
        isTemplateUpgradeRequired: Property.Checkbox({
            displayName: 'Is Template Upgrade Required',
            description: 'Whether template upgrade is required (for Amend action).',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const {
            realm,
            user,
            passwordAdapter,
            contractId,
            action,
            amendmentType,
            amendmentReason,
            isTemplateUpgradeRequired,
        } = context.propsValue;

        const queryParams: Record<string, string> = {
            realm,
            user,
            passwordAdapter,
        };

        const body: Record<string, unknown> = {
            action,
        };

        if (action === 'amend') {
            body['amendAttributes'] = {
                ...(amendmentType && { amendmentType }),
                ...(amendmentReason && { amendmentReason }),
                isTemplateUpgradeRequired,
            };
        }

        const response = await sapAribaCommon.makeRequest(
            context.auth,
            HttpMethod.POST,
            `/contractWorkspaces/${encodeURIComponent(contractId)}/state`,
            queryParams,
            body
        );

        return response;
    },
});
