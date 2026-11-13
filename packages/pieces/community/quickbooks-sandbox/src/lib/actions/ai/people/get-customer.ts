import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetCustomerOutputSchema } from '../../../output-schemas';

export const getCustomerAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_customer',
	outputSchema: quickbooksSandboxGetCustomerOutputSchema,
	displayName: 'Get Customer',
	description: 'Gets one customer by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Reads one customer with its contact details, addresses, balance and SyncToken. Get the id from List Customers or Create Customer.',
		idempotent: true,
	},
	props: {
		customerId: quickbooksAiProps.id({
			required: true,
			displayName: 'Customer ID',
			description: 'QuickBooks customer id. Use List Customers to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Customer',
			id: context.propsValue.customerId,
		});
	},
});
