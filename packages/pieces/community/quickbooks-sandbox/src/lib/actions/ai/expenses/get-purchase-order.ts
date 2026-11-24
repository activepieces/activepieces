import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreatePurchaseOrderOutputSchema } from '../../../output-schemas';

export const getPurchaseOrderAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_purchase_order',
	outputSchema: quickbooksSandboxCreatePurchaseOrderOutputSchema,
	displayName: 'Get Purchase Order',
	description: 'Gets one purchase order by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one purchase order with its lines, status (POStatus), totals and SyncToken. Get the id from List Purchase Orders or Create Purchase Order.',
		idempotent: true,
	},
	props: {
		purchaseOrderId: quickbooksAiProps.id({
			required: true,
			displayName: 'Purchase Order ID',
			description: 'QuickBooks purchase order id. Use List Purchase Orders to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'PurchaseOrder',
			id: context.propsValue.purchaseOrderId,
		});
	},
});
