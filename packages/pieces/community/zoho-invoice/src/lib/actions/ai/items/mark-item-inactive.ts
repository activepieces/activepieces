import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const markItemInactiveAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_mark_item_inactive',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Mark Item Inactive',
	description: 'Marks an item as inactive.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Deactivates an item so it no longer appears for new transactions, keeping its history. Prefer it over Delete Item for items already used. Use List Items to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		itemId: zohoInvoiceAiProps.itemId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.markItemInactive({
			auth,
			organizationId: propsValue.organizationId,
			itemId: propsValue.itemId,
		});
	},
});
