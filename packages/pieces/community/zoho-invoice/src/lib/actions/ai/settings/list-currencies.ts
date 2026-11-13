import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListCurrenciesOutputSchema } from '../../../output-schemas';

export const listCurrenciesAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_currencies',
	outputSchema: zohoInvoiceListCurrenciesOutputSchema,
	displayName: 'List Currencies',
	description: 'Lists the currencies of a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the currencies enabled in the organization with currency_id, code, symbol and whether it is the base currency, one page at a time. Use it to find the currency_id other actions need.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		filterBy: Property.StaticDropdown({
			displayName: 'Filter',
			description: 'Exclude the base currency. Empty = all currencies.',
			required: false,
			options: {
				disabled: false,
				options: [{ label: 'Exclude Base Currency', value: 'Currencies.ExcludeBaseCurrency' }],
			},
		}),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listCurrencies({
			auth,
			organizationId: propsValue.organizationId,
			filterBy: propsValue.filterBy,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
