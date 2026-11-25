import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreatePurchaseOutputSchema } from '../../../output-schemas';

export const getPurchaseAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_purchase',
	outputSchema: quickbooksSandboxCreatePurchaseOutputSchema,
	displayName: 'Get Purchase',
	description: 'Gets one purchase by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one purchase (an expense, check or credit card charge) with its payment type, account, lines and SyncToken. Get the id from List Purchases or Create Purchase.',
		idempotent: true,
	},
	props: {
		purchaseId: quickbooksAiProps.id({
			required: true,
			displayName: 'Purchase ID',
			description: 'QuickBooks purchase id. Use List Purchases to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Purchase',
			id: context.propsValue.purchaseId,
		});
	},
});
