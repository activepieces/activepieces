import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { QueryResult, salesforceUtils } from '../../common/utils';
import { soqlQueryOutputSchema } from '../../output-schemas';

export const runToolingQuery = createAction({
	auth: salesforceAuth,
	name: 'run_tooling_query',
	classification: 'SEARCH',
	displayName: 'Run Tooling Query',
	description: 'Run a SOQL query against the Tooling API for setup metadata.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Runs a SOQL query against the Tooling API to read setup metadata such as ApexClass, ApexTrigger, CustomField, Flow, ValidationRule or FieldDefinition. Use it for questions about org configuration and code; for business records use Run SOQL Query, and for a single object\'s fields Describe Object is simpler. Requires a user with View Setup permission; always add a LIMIT and page with Get Next Query Page. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: soqlQueryOutputSchema,
	props: {
		query: Property.LongText({
			displayName: 'SOQL Query',
			description: 'A Tooling API SOQL statement, e.g. SELECT Id, Name FROM ApexClass LIMIT 50.',
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
			`/services/data/v56.0/tooling/query?q=${encodeURIComponent(query)}`,
			undefined
		);
		return salesforceUtils.formatQueryResult(response.body);
	},
});
