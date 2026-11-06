import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceExchangeRateOutputSchema } from '../../../output-schemas';

export const getExchangeRateAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_exchange_rate',
	outputSchema: zohoInvoiceExchangeRateOutputSchema,
	displayName: 'Get Exchange Rate',
	description: 'Gets one exchange rate of a currency in Zoho Invoice.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one exchange rate by ID: rate and effective date. Use List Currencies for the currency ID and List Exchange Rates for the exchange rate ID.',
		idempotent: true,
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
		return await zohoInvoiceApi.getExchangeRate({
			auth,
			organizationId: propsValue.organizationId,
			currencyId: propsValue.currencyId,
			exchangeRateId: propsValue.exchangeRateId,
		});
	},
});
