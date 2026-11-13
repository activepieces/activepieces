import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksApi } from '../../../common/api';
import type { QuickbooksQueryEnvelope } from '../../../common/types';
import { quickbooksSandboxRunQueryOutputSchema } from '../../../output-schemas';

export const runQueryAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_run_query',
	outputSchema: quickbooksSandboxRunQueryOutputSchema,
	displayName: 'Run Query',
	description: 'Runs a raw QuickBooks query.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Runs one raw QuickBooks query statement against any entity, including SELECT COUNT(*) and selected columns. Pick it over a List action for counts or entities with no List action. Returns QuickBooks\' QueryResponse as-is: an array named after the entity (e.g. QueryResponse.Invoice) with startPosition and maxResults, or totalCount for a COUNT(*). Results are capped at 1000 rows per call; page with STARTPOSITION and MAXRESULTS in the statement.',
		idempotent: true,
	},
	props: {
		query: Property.LongText({
			displayName: 'Query',
			description:
				'QuickBooks query statement, e.g. "SELECT * FROM Invoice WHERE Balance > \'0\' ORDERBY TxnDate DESC STARTPOSITION 1 MAXRESULTS 100" or "SELECT COUNT(*) FROM Customer". Strings and dates go in single quotes; filters join with AND only.',
			required: true,
		}),
	},
	async run(context) {
		const response = await quickbooksApi.query<QuickbooksQueryEnvelope>({
			auth: context.auth,
			query: context.propsValue.query,
		});
		if (!response.QueryResponse) {
			throw new Error('QuickBooks returned no QueryResponse for this query.');
		}
		return response;
	},
});
