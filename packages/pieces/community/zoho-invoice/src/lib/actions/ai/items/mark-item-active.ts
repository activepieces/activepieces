import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const markItemActiveAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_mark_item_active',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Mark Item Active',
	description: 'Marks an inactive item as active.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Reactivates an item so it can be used on invoices and estimates again. Use List Items to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		itemId: zohoInvoiceAiProps.itemId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.markItemActive({
			auth,
			organizationId: propsValue.organizationId,
			itemId: propsValue.itemId,
		});
	},
});
