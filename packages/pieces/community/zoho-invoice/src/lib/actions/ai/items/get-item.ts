import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceItemOutputSchema } from '../../../output-schemas';

export const getItemAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_item',
	outputSchema: zohoInvoiceItemOutputSchema,
	displayName: 'Get Item',
	description: 'Gets one item (product or service) by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one item by ID: name, rate, description, SKU, tax, product type and status. Use List Items to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		itemId: zohoInvoiceAiProps.itemId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getItem({
			auth,
			organizationId: propsValue.organizationId,
			itemId: propsValue.itemId,
		});
	},
});
