import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateItemOutputSchema } from '../../../output-schemas';

export const getItemAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_item',
	outputSchema: quickbooksSandboxCreateItemOutputSchema,
	displayName: 'Get Item',
	description: 'Gets one product or service by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one item (product, service or category) with its type, prices, accounts, quantity on hand and SyncToken. Get the id from List Items or Create Item.',
		idempotent: true,
	},
	props: {
		itemId: quickbooksAiProps.id({
			required: true,
			displayName: 'Item ID',
			description: 'QuickBooks item id. Use List Items to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Item',
			id: context.propsValue.itemId,
		});
	},
});
