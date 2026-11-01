import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceListExchangeRatesOutputSchema } from '../../../output-schemas';

export const listExchangeRatesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_exchange_rates',
	outputSchema: zohoInvoiceListExchangeRatesOutputSchema,
	displayName: 'List Exchange Rates',
	description: 'Lists the exchange rates of a currency in Zoho Invoice.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the exchange rates recorded for one foreign currency with exchange_rate_id, rate and effective date. Use List Currencies to find the currency ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		currencyId: zohoInvoiceAiProps.currencyId({ required: true }),
		fromDate: Property.ShortText({
			displayName: 'From Date',
			description: 'Only rates effective on or after this date, as yyyy-mm-dd.',
			required: false,
		}),
		isCurrentDate: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Current Rate Only',
			description: 'Yes = only the rate effective today. Empty = all rates.',
		}),
		sortColumn: zohoInvoiceAiProps.sortColumn({
			required: false,
			description: 'Field to sort by, e.g. effective_date.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listExchangeRates({
			auth,
			organizationId: propsValue.organizationId,
			currencyId: propsValue.currencyId,
			fromDate: propsValue.fromDate,
			isCurrentDate: zohoInvoiceUtils.toOptionalBoolean({ value: propsValue.isCurrentDate }),
			sortColumn: propsValue.sortColumn,
		});
	},
});
