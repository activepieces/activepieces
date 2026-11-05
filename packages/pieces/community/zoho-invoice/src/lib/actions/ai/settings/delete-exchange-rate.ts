import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteExchangeRateAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_exchange_rate',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Exchange Rate',
	description: 'Removes an exchange rate from a currency in Zoho Invoice.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently removes an exchange rate from a currency. Use List Currencies for the currency ID and List Exchange Rates for the exchange rate ID. Needs the Admin role. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		currencyId: zohoInvoiceAiProps.currencyId({ required: true }),
		exchangeRateId: zohoInvoiceAiProps.idProp({
			required: true,
			displayName: 'Exchange Rate ID',
			description: 'Exchange rate ID. Use List Exchange Rates to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteExchangeRate({
			auth,
			organizationId: propsValue.organizationId,
			currencyId: propsValue.currencyId,
			exchangeRateId: propsValue.exchangeRateId,
		});
	},
});
