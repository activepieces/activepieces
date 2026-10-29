import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteItemAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_item',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Item',
	description: 'Deletes an item.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes an item. Use List Items to find the ID. Items used in transactions cannot be deleted; use Mark Item Inactive instead. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		itemId: zohoInvoiceAiProps.itemId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteItem({
			auth,
			organizationId: propsValue.organizationId,
			itemId: propsValue.itemId,
		});
	},
});
