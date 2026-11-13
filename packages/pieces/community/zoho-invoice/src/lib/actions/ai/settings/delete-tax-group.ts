import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteTaxGroupAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_tax_group',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Tax Group',
	description: 'Deletes a tax group from a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a tax group; the taxes in it are kept. Use List Taxes to find the ID; use Delete Tax for a single tax. Needs the Admin role. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		taxGroupId: zohoInvoiceAiProps.idProp({
			required: true,
			displayName: 'Tax Group ID',
			description: 'Tax group ID. Use List Taxes to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteTaxGroup({
			auth,
			organizationId: propsValue.organizationId,
			taxGroupId: propsValue.taxGroupId,
		});
	},
});
