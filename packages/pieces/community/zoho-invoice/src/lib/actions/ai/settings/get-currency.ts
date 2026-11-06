import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceCurrencyOutputSchema } from '../../../output-schemas';

export const getCurrencyAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_currency',
	outputSchema: zohoInvoiceCurrencyOutputSchema,
	displayName: 'Get Currency',
	description: 'Gets one currency of a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one currency by ID: code, symbol, precision, format and whether it is the base currency. Use List Currencies to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		currencyId: zohoInvoiceAiProps.currencyId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getCurrency({
			auth,
			organizationId: propsValue.organizationId,
			currencyId: propsValue.currencyId,
		});
	},
});
