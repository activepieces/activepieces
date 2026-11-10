import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAssociateAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateManyContractsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_many_contracts',
	outputSchema: zohoDeskAssociateAccountProductsOutputSchema,
	displayName: 'Update Many Contracts',
	description: 'Sets one field to the same value on several contracts.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Sets one field (by API name) to the same value on several contracts at once.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contractIds: Property.Array({
			displayName: 'Contract IDs',
			description: 'Contract IDs to update.',
			required: true,
		}),
		fieldName: Property.ShortText({
			displayName: 'Field Name',
			description: 'API name of the field to set (from List Fields, module contracts).',
			required: true,
		}),
		fieldValue: Property.ShortText({
			displayName: 'Field Value',
			description: 'Value to set.',
			required: true,
		}),
		isCustomField: zohoDeskAiProps.yesNo({
			required: true,
			displayName: 'Is Custom Field',
			description: 'Yes when Field Name is a custom field; No for a standard field.',
		}),
	},
	async run(context) {
		const { orgId, contractIds, fieldName, fieldValue, isCustomField } = context.propsValue;
		return await zohoDeskApi.updateManyContracts({
			auth: context.auth,
			orgId,
			contractIds: zohoDeskUtils.requiredStringList({
				value: contractIds,
				propName: 'Contract IDs',
			}),
			fieldName,
			fieldValue,
			isCustomField,
		});
	},
});
