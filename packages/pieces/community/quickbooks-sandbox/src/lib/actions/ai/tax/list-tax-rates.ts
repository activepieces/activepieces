import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListTaxRatesOutputSchema } from '../../../output-schemas';

export const listTaxRatesAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_tax_rates',
	outputSchema: quickbooksSandboxListTaxRatesOutputSchema,
	displayName: 'List Tax Rates',
	description: 'Lists tax rates, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists tax rates (a percentage owed to one tax agency), with an optional QuickBooks query filter (e.g. "Active = true") and sort. Page with startPosition and the returned nextStartPosition (null on the last page).',
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
			entity: 'TaxRate',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
