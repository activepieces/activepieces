import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sapAribaAuth } from '../auth';
import { sapAribaCommon } from '../common';

export const createContractWorkspace = createAction({
    auth: sapAribaAuth,
    name: 'create_contract_workspace',
    displayName: 'Create Contract Workspace',
    description: 'Create a new contract workspace in SAP Ariba Contracts.',
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
        title: Property.ShortText({
            displayName: 'Title',
            description: 'Contract workspace title.',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Contract workspace description.',
            required: false,
        }),
        templateId: Property.ShortText({
            displayName: 'Template ID',
            description: 'Template ID for the contract workspace.',
            required: false,
        }),
        effectiveDate: Property.DateTime({
            displayName: 'Effective Date',
            description: 'Contract effective date.',
            required: false,
        }),
        expirationDate: Property.DateTime({
            displayName: 'Expiration Date',
            description: 'Contract expiration date.',
            required: false,
        }),
        contractAmount: Property.Number({
            displayName: 'Contract Amount',
            description: 'Contract amount value.',
            required: false,
        }),
        contractCurrency: Property.ShortText({
            displayName: 'Contract Currency',
            description: 'Currency code (e.g., USD).',
            required: false,
        }),
        ownerUniqueName: Property.ShortText({
            displayName: 'Owner Unique Name',
            description: 'Owner user unique name.',
            required: false,
        }),
        ownerPasswordAdapter: Property.ShortText({
            displayName: 'Owner Password Adapter',
            description: 'Owner password adapter.',
            required: false,
        }),
        supplierName: Property.ShortText({
            displayName: 'Supplier Name',
            description: 'Supplier organization name.',
            required: false,
        }),
        supplierSystemId: Property.ShortText({
            displayName: 'Supplier System ID',
            description: 'Supplier system ID.',
            required: false,
        }),
        isTestProject: Property.Checkbox({
            displayName: 'Is Test Project',
            description: 'Mark as test project.',
            required: false,
            defaultValue: false,
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
            title,
            description,
            templateId,
            effectiveDate,
            expirationDate,
            contractAmount,
            contractCurrency,
            ownerUniqueName,
            ownerPasswordAdapter,
            supplierName,
            supplierSystemId,
            isTestProject,
            additionalFields,
        } = context.propsValue;

        const queryParams: Record<string, string> = {
            realm,
            user,
            passwordAdapter,
        };

        const body: Record<string, unknown> = {
            title,
        };

        if (description) body['description'] = description;
        if (templateId) body['templateId'] = templateId;
        if (effectiveDate) body['effectiveDate'] = effectiveDate;
        if (expirationDate) body['expirationDate'] = expirationDate;
        if (isTestProject !== undefined) body['isTestProject'] = isTestProject;

        if (contractAmount && contractCurrency) {
            body['contractAmount'] = {
                amount: contractAmount,
                currency: contractCurrency,
            };
        }

        if (ownerUniqueName) {
            body['owner'] = {
                uniqueName: ownerUniqueName,
                passwordAdapter: ownerPasswordAdapter || passwordAdapter,
            };
        }

        if (supplierName || supplierSystemId) {
            body['supplier'] = {
                ...(supplierName && { name: supplierName }),
                ...(supplierSystemId && { systemID: supplierSystemId }),
            };
        }

        if (additionalFields && typeof additionalFields === 'object') {
            Object.assign(body, additionalFields);
        }

        const response = await sapAribaCommon.makeRequest(
            context.auth,
            HttpMethod.POST,
            '/contractWorkspaces',
            queryParams,
            body
        );

        return response;
    },
});
