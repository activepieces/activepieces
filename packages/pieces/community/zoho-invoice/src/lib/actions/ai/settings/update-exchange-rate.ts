import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceExchangeRateOutputSchema } from '../../../output-schemas';

export const updateExchangeRateAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_exchange_rate',
	outputSchema: zohoInvoiceExchangeRateOutputSchema,
	displayName: 'Update Exchange Rate',
	description: "Changes an exchange rate's value or effective date.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes an exchange rate's value or effective date. Fields left empty keep their current value. Use List Currencies for the currency ID and List Exchange Rates for the exchange rate ID. Needs the Admin role. Zoho echoes a new effective date in the response but may keep the old one; confirm with Get Exchange Rate.",
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
		rate: Property.Number({
			displayName: 'Rate',
			description:
				'New value of one unit of this currency in the base currency. Empty = unchanged.',
			required: false,
		}),
		effectiveDate: Property.ShortText({
			displayName: 'Effective Date',
			description: 'New date the rate applies from, as yyyy-mm-dd. Empty = unchanged.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.updateExchangeRate({
			auth,
			organizationId: propsValue.organizationId,
			currencyId: propsValue.currencyId,
			exchangeRateId: propsValue.exchangeRateId,
			body: zohoInvoiceUtils.compact({
				rate: propsValue.rate,
				effective_date: propsValue.effectiveDate,
			}),
		});
	},
});
