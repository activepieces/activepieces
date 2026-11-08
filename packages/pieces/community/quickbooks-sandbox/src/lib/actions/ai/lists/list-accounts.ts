import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListAccountsOutputSchema } from '../../../output-schemas';

export const listAccountsAiAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_accounts',
	outputSchema: quickbooksSandboxListAccountsOutputSchema,
	displayName: 'List Accounts',
	description: 'Lists accounts, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists chart-of-accounts entries one page at a time, with an optional QuickBooks query filter (e.g. "AccountType = \'Bank\'" or "Name LIKE \'Office%\'") and sort. Inactive accounts are left out unless the filter asks for them (e.g. "Active = false"). Page with startPosition and the returned nextStartPosition (null on the last page).',
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
			entity: 'Account',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
