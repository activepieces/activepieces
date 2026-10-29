import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteTaxAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_tax',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Tax',
	description: 'Deletes a tax from a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a tax; a tax used on transactions cannot be deleted. Use List Taxes to find the ID; use Delete Tax Group for a tax group. Needs the Admin role. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		taxId: zohoInvoiceAiProps.taxId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteTax({
			auth,
			organizationId: propsValue.organizationId,
			taxId: propsValue.taxId,
		});
	},
});
