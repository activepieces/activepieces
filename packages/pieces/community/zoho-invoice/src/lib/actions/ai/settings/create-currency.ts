import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceCurrencyOutputSchema } from '../../../output-schemas';

export const createCurrencyAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_currency',
	outputSchema: zohoInvoiceCurrencyOutputSchema,
	displayName: 'Create Currency',
	description: 'Adds a currency to a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a foreign currency to the organization so it can be used on invoices and contacts. Needs the Admin role. Not idempotent: a currency code that already exists is rejected.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		currencyCode: Property.ShortText({
			displayName: 'Currency Code',
			description: 'ISO 4217 currency code, e.g. "EUR".',
			required: true,
		}),
		currencySymbol: Property.ShortText({
			displayName: 'Currency Symbol',
			description: 'Symbol shown with amounts, e.g. "€".',
			required: true,
		}),
		pricePrecision: Property.Number({
			displayName: 'Price Precision',
			description: 'Number of decimal places (0, 2 or 3). Empty = the vendor default.',
			required: false,
		}),
		currencyFormat: Property.ShortText({
			displayName: 'Currency Format',
			description:
				'Number format: 1,234,567.89, 1.234.567,89, 1 234 567,89, 12,34,567.89 or 1234567.89 (Zoho requires one).',
			required: true,
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createCurrency({
			auth,
			organizationId: propsValue.organizationId,
			body: {
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					currency_code: propsValue.currencyCode,
					currency_symbol: propsValue.currencySymbol,
					price_precision: propsValue.pricePrecision,
					currency_format: propsValue.currencyFormat,
				}),
			},
		});
	},
});
