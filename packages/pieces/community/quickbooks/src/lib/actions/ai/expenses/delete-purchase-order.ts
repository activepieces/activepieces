import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksDeletePurchaseOrderOutputSchema } from '../../../output-schemas';

export const deletePurchaseOrderAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_delete_purchase_order',
	outputSchema: quickbooksDeletePurchaseOrderOutputSchema,
	displayName: 'Delete Purchase Order',
	description: 'Permanently deletes a purchase order.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one purchase order; it cannot be restored. Reads the latest SyncToken first. Get the id from List Purchase Orders.',
		idempotent: false,
	},
	props: {
		purchaseOrderId: quickbooksAiProps.id({
			required: true,
			displayName: 'Purchase Order ID',
			description: 'QuickBooks purchase order id. Use List Purchase Orders to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'PurchaseOrder',
			id: context.propsValue.purchaseOrderId,
		});
	},
});
