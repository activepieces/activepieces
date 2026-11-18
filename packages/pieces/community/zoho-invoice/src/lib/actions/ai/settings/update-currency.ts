import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceCurrencyOutputSchema } from '../../../output-schemas';

export const updateCurrencyAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_currency',
	outputSchema: zohoInvoiceCurrencyOutputSchema,
	displayName: 'Update Currency',
	description: "Changes a currency's code, symbol, precision or format.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes a currency's code, symbol, decimal precision or number format. Fields left empty keep their current value. Use List Currencies to find the ID. Needs the Admin role.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		currencyId: zohoInvoiceAiProps.currencyId({ required: true }),
		currencyCode: Property.ShortText({
			displayName: 'Currency Code',
			description: 'New ISO 4217 currency code. Empty = unchanged.',
			required: false,
		}),
		currencySymbol: Property.ShortText({
			displayName: 'Currency Symbol',
			description: 'New symbol. Empty = unchanged.',
			required: false,
		}),
		pricePrecision: Property.Number({
			displayName: 'Price Precision',
			description: 'New number of decimal places (0, 2 or 3). Empty = unchanged.',
			required: false,
		}),
		currencyFormat: Property.ShortText({
			displayName: 'Currency Format',
			description: 'New number format, e.g. "1,234,567.89". Empty = unchanged.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const { organizationId, currencyId } = propsValue;
		const current = await zohoInvoiceApi.getCurrency({ auth, organizationId, currencyId });
		return await zohoInvoiceApi.updateCurrency({
			auth,
			organizationId,
			currencyId,
			body: zohoInvoiceUtils.compact({
				currency_code: propsValue.currencyCode ?? current.currency?.currency_code,
				currency_symbol: propsValue.currencySymbol ?? current.currency?.currency_symbol,
				price_precision: propsValue.pricePrecision ?? current.currency?.price_precision,
				currency_format: propsValue.currencyFormat ?? current.currency?.currency_format,
			}),
		});
	},
});
