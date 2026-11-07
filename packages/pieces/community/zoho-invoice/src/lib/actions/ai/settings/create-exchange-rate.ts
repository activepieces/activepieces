import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceExchangeRateOutputSchema } from '../../../output-schemas';

export const createExchangeRateAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_exchange_rate',
	outputSchema: zohoInvoiceExchangeRateOutputSchema,
	displayName: 'Create Exchange Rate',
	description: 'Adds an exchange rate to a currency in Zoho Invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds an exchange rate (to the base currency) for a foreign currency, effective from a given date. Use List Currencies to find the currency ID. Needs the Admin role. Not idempotent.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		currencyId: zohoInvoiceAiProps.currencyId({ required: true }),
		rate: Property.Number({
			displayName: 'Rate',
			description: 'Value of one unit of this currency in the base currency.',
			required: true,
		}),
		effectiveDate: Property.ShortText({
			displayName: 'Effective Date',
			description: 'Date the rate applies from, as yyyy-mm-dd.',
			required: true,
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createExchangeRate({
			auth,
			organizationId: propsValue.organizationId,
			currencyId: propsValue.currencyId,
			body: {
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					rate: propsValue.rate,
					effective_date: propsValue.effectiveDate,
				}),
			},
		});
	},
});
