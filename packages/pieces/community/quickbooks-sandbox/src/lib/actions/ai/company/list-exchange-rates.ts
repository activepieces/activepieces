import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListExchangeRatesOutputSchema } from '../../../output-schemas';

export const listExchangeRatesAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_exchange_rates',
	outputSchema: quickbooksSandboxListExchangeRatesOutputSchema,
	displayName: 'List Exchange Rates',
	description: 'Lists exchange rates, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists currency exchange rates against the home currency, with an optional QuickBooks query filter (e.g. "SourceCurrencyCode = \'EUR\'" or "AsOfDate = \'2025-01-01\'") and sort. Needs multicurrency on, which can\'t be turned off once enabled; use Get Exchange Rate for one currency on one date. Page with startPosition and the returned nextStartPosition (null on the last page).',
		idempotent: true,
	},
	props: {
		where: quickbooksAiProps.where({ required: false }),
		orderBy: quickbooksAiProps.orderBy({ required: false }),
		limit: quickbooksAiProps.limit({ required: false }),
		startPosition: quickbooksAiProps.startPosition({ required: false }),
	},
	async run(context) {
		const { where, orderBy, limit, startPosition } = context.propsValue;
		return await quickbooksApi.listEntities({
			auth: context.auth,
			entity: 'ExchangeRate',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
