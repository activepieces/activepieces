import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListTaxAgenciesOutputSchema } from '../../../output-schemas';

export const listTaxAgenciesAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_tax_agencies',
	outputSchema: quickbooksSandboxListTaxAgenciesOutputSchema,
	displayName: 'List Tax Agencies',
	description: 'Lists tax agencies, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists tax agencies (the authorities sales tax is paid to), with an optional QuickBooks query filter (e.g. "DisplayName LIKE \'%State%\'") and sort. Use it to find the TaxAgencyId for Create Tax Code. Page with startPosition and the returned nextStartPosition (null on the last page).',
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
			entity: 'TaxAgency',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
