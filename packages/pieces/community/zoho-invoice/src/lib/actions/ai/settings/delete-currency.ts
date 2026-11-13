import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteCurrencyAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_currency',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Currency',
	description: 'Removes a currency from a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently removes a currency from the organization; the base currency and currencies used on transactions cannot be deleted. Use List Currencies to find the ID. Needs the Admin role. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		currencyId: zohoInvoiceAiProps.currencyId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteCurrency({
			auth,
			organizationId: propsValue.organizationId,
			currencyId: propsValue.currencyId,
		});
	},
});
