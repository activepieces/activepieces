import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetCustomerTypeOutputSchema } from '../../../output-schemas';

export const getCustomerTypeAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_customer_type',
	displayName: 'Get Customer Type',
	description: 'Gets one customer type by id.',
	audience: 'ai',
	outputSchema: quickbooksSandboxGetCustomerTypeOutputSchema,
	classification: 'READ',
	aiMetadata: {
		description: 'Reads one customer type with its name and Active status. Get the id from List Customer Types.',
		idempotent: true,
	},
	props: {
		customerTypeId: quickbooksAiProps.id({
			required: true,
			displayName: 'Customer Type ID',
			description: 'QuickBooks customer type id. Use List Customer Types to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'CustomerType',
			id: context.propsValue.customerTypeId,
		});
	},
});
