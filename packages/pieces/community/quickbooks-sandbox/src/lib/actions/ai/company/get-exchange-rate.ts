import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksClient } from '../../../common/client';
import { quickbooksSandboxGetExchangeRateOutputSchema } from '../../../output-schemas';

export const getExchangeRateAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_exchange_rate',
	outputSchema: quickbooksSandboxGetExchangeRateOutputSchema,
	displayName: 'Get Exchange Rate',
	description: 'Gets the exchange rate of one currency.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads the exchange rate from one currency to the home currency on a date (today when no date is set). Needs multicurrency on; use List Exchange Rates to see many currencies or dates.',
		idempotent: true,
	},
	props: {
		sourceCurrencyCode: Property.ShortText({
			displayName: 'Source Currency Code',
			description: 'Three-letter ISO 4217 code of the currency to convert from, e.g. EUR.',
			required: true,
		}),
		asOfDate: quickbooksAiProps.date({
			required: false,
			displayName: 'As Of Date',
			description: 'Date of the rate, YYYY-MM-DD. Defaults to today.',
		}),
	},
	async run(context) {
		const { sourceCurrencyCode, asOfDate } = context.propsValue;
		return await quickbooksClient.request<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: '/exchangerate',
			query: { sourcecurrencycode: sourceCurrencyCode, asofdate: asOfDate },
		});
	},
});
