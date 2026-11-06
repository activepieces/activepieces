import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxSendPurchaseOrderOutputSchema } from '../../../output-schemas';

export const sendPurchaseOrderAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_send_purchase_order',
	outputSchema: quickbooksSandboxSendPurchaseOrderOutputSchema,
	displayName: 'Send Purchase Order',
	description: 'Emails a purchase order to the vendor.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Emails one purchase order as a PDF, to Send To or, when empty, to the PO email on the purchase order. Each call sends another email. Get the id from List Purchase Orders.',
		idempotent: false,
	},
	props: {
		purchaseOrderId: quickbooksAiProps.id({
			required: true,
			displayName: 'Purchase Order ID',
			description: 'QuickBooks purchase order id. Use List Purchase Orders to find it.',
		}),
		sendTo: quickbooksAiProps.sendTo({ required: false }),
	},
	async run(context) {
		return await quickbooksApi.sendEntity({
			auth: context.auth,
			entity: 'PurchaseOrder',
			id: context.propsValue.purchaseOrderId,
			sendTo: context.propsValue.sendTo,
		});
	},
});
