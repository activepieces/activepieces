import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetCreditMemoPdfOutputSchema } from '../../../output-schemas';

export const getPurchaseOrderPdfAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_purchase_order_pdf',
	outputSchema: quickbooksSandboxGetCreditMemoPdfOutputSchema,
	displayName: 'Get Purchase Order PDF',
	description: 'Downloads a purchase order as a PDF file.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Downloads one purchase order as a PDF and returns it as a file reference. Get the id from List Purchase Orders.',
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
		const { purchaseOrderId } = context.propsValue;
		const data = await quickbooksApi.downloadPdf({ auth: context.auth, entity: 'PurchaseOrder', id: purchaseOrderId });
		const fileName = `purchase-order-${purchaseOrderId}.pdf`;
		const file = await context.files.write({ fileName, data });
		return { file, fileName };
	},
});
