import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { QueryResult, salesforceUtils } from '../../common/utils';
import { soqlQueryOutputSchema } from '../../output-schemas';

export const runSoqlQueryAll = createAction({
	auth: salesforceAuth,
	name: 'run_soql_query_all',
	classification: 'SEARCH',
	displayName: 'Run SOQL Query All',
	description: 'Run a SOQL query that also returns deleted and archived records.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Runs a SOQL query that also returns records in the Recycle Bin and archived records (e.g. old Tasks and Events); filter on IsDeleted = true to find only deleted ones. Use it for recovery or audit; for normal reads use Run SOQL Query. Always add a LIMIT; if next_records_url is not null, fetch more with Get Next Query Page. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: soqlQueryOutputSchema,
	props: {
		query: Property.LongText({
			displayName: 'SOQL Query',
			description: 'A complete SOQL statement with explicit fields and a LIMIT.',
			required: true,
		}),
	},
	async run(context) {
		const query = context.propsValue.query.trim();
		if (query.length === 0) {
			throw new Error('SOQL Query is required.');
		}
		const response = await callSalesforceApi<QueryResult<unknown>>(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/queryAll?q=${encodeURIComponent(query)}`,
			undefined
		);
		return salesforceUtils.formatQueryResult(response.body);
	},
});
