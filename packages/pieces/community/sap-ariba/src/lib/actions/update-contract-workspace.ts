import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sapAribaAuth } from '../auth';
import { sapAribaCommon } from '../common';

export const updateContractWorkspace = createAction({
    auth: sapAribaAuth,
    name: 'update_contract_workspace',
    displayName: 'Update Contract Workspace',
    description: 'Update an existing contract workspace in SAP Ariba Contracts.',
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
            description: 'The ID of the contract workspace to update.',
            required: true,
        }),
        silentUpdate: Property.StaticDropdown({
            displayName: 'Silent Update',
            description: 'Update without changing the last modified date.',
            required: false,
            options: {
                disabled: false,
                options: [
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' },
                ],
            },
        }),
        title: Property.ShortText({
            displayName: 'Title',
            description: 'New title.',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'New description.',
            required: false,
        }),
        effectiveDate: Property.DateTime({
            displayName: 'Effective Date',
            description: 'New effective date.',
            required: false,
        }),
        expirationDate: Property.DateTime({
            displayName: 'Expiration Date',
            description: 'New expiration date.',
            required: false,
        }),
        contractAmount: Property.Number({
            displayName: 'Contract Amount',
            description: 'New contract amount value.',
            required: false,
        }),
        contractCurrency: Property.ShortText({
            displayName: 'Contract Currency',
            description: 'Currency code (e.g., USD).',
            required: false,
        }),
        amendmentReason: Property.LongText({
            displayName: 'Amendment Reason',
            description: 'Reason for amendment.',
            required: false,
        }),
        additionalFields: Property.Json({
            displayName: 'Additional Fields',
            description: 'Additional fields as JSON object to merge with the request body.',
            required: false,
        }),
    },
    async run(context) {
        const {
            realm,
            user,
            passwordAdapter,
            contractId,
            silentUpdate,
            title,
            description,
            effectiveDate,
            expirationDate,
            contractAmount,
            contractCurrency,
            amendmentReason,
            additionalFields,
        } = context.propsValue;

        const queryParams: Record<string, string> = {
            realm,
            user,
            passwordAdapter,
        };

        if (silentUpdate) {
            queryParams['silentUpdate'] = silentUpdate;
        }

        const body: Record<string, unknown> = {
            contractId,
        };

        if (title) body['title'] = title;
        if (description) body['description'] = description;
        if (effectiveDate) body['effectiveDate'] = effectiveDate;
        if (expirationDate) body['expirationDate'] = expirationDate;
        if (amendmentReason) body['amendmentReason'] = amendmentReason;

        if (contractAmount && contractCurrency) {
            body['contractAmount'] = {
                amount: contractAmount,
                currency: contractCurrency,
            };
        }

        if (additionalFields && typeof additionalFields === 'object') {
            Object.assign(body, additionalFields);
        }

        const response = await sapAribaCommon.makeRequest(
            context.auth,
            HttpMethod.PATCH,
            '/contractWorkspaces',
            queryParams,
            body
        );

        return response;
    },
});
