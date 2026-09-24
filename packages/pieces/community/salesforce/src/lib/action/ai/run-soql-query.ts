import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { querySalesforceApi } from '../../common';
import { QueryResult, salesforceUtils } from '../../common/utils';
import { soqlQueryOutputSchema } from '../../output-schemas';

export const runSoqlQuery = createAction({
	auth: salesforceAuth,
	name: 'run_soql_query',
	classification: 'SEARCH',
	displayName: 'Run SOQL Query',
	description: 'Run a SOQL query and return the matching records.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Runs a SOQL query (e.g. SELECT Id, Name FROM Account WHERE Industry = \'Technology\' LIMIT 50) and returns the matching records, excluding deleted and archived ones. Use it for filtered, sorted, related or aggregate reads; to include the Recycle Bin use Run SOQL Query All, for keyword search across objects use Search Records (SOSL), and for setup metadata use Run Tooling Query. Always add a LIMIT; if next_records_url is not null, fetch more with Get Next Query Page. Read-only; safe to retry.',
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
		const response = await querySalesforceApi<QueryResult<unknown>>(HttpMethod.GET, context.auth, query);
		return salesforceUtils.formatQueryResult(response.body);
	},
});
