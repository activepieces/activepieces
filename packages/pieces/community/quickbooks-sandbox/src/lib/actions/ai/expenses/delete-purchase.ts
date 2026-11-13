import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeletePurchaseOutputSchema } from '../../../output-schemas';

export const deletePurchaseAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_purchase',
	outputSchema: quickbooksSandboxDeletePurchaseOutputSchema,
	displayName: 'Delete Purchase',
	description: 'Permanently deletes a purchase.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one purchase; it cannot be restored. Reads the latest SyncToken first. Get the id from List Purchases.',
		idempotent: false,
	},
	props: {
		purchaseId: quickbooksAiProps.id({
			required: true,
			displayName: 'Purchase ID',
			description: 'QuickBooks purchase id. Use List Purchases to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'Purchase',
			id: context.propsValue.purchaseId,
		});
	},
});
