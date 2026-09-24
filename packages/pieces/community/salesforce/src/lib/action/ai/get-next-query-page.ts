import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { QueryResult, salesforceUtils } from '../../common/utils';
import { soqlQueryOutputSchema } from '../../output-schemas';

export const getNextQueryPage = createAction({
	auth: salesforceAuth,
	name: 'get_next_query_page',
	classification: 'READ',
	displayName: 'Get Next Query Page',
	description: 'Fetch the next page of a query result.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fetches the next batch of records for a query whose result had a non-null next_records_url, from Run SOQL Query, Run SOQL Query All, Run Tooling Query or Get Child Records. Pass that next_records_url exactly as returned (or just the query locator); keep calling until next_records_url is null. Read-only; safe to retry while the cursor is alive (about 15 minutes of inactivity).',
		idempotent: true,
	},
	outputSchema: soqlQueryOutputSchema,
	props: {
		next_records_url: Property.ShortText({
			displayName: 'Next Records URL',
			description: 'The next_records_url from a previous query result, e.g. /services/data/v56.0/query/01gD0000002HU6KIAW-2000.',
			required: true,
		}),
	},
	async run(context) {
		const path = toQueryPath(context.propsValue.next_records_url);
		const response = await callSalesforceApi<QueryResult<unknown>>(HttpMethod.GET, context.auth, path, undefined);
		return salesforceUtils.formatQueryResult(response.body);
	},
});

function toQueryPath(value: string): string {
	const trimmed = value.trim();
	if (NEXT_RECORDS_URL_PATTERN.test(trimmed)) {
		return trimmed;
	}
	if (LOCATOR_PATTERN.test(trimmed)) {
		return `/services/data/v56.0/query/${trimmed}`;
	}
	throw new Error('Next Records URL must be a next_records_url returned by a query, such as /services/data/v56.0/query/01g...-2000.');
}

const NEXT_RECORDS_URL_PATTERN = /^\/services\/data\/v\d+\.\d+\/(?:tooling\/)?(?:query|queryAll)\/[A-Za-z0-9-]+$/;
const LOCATOR_PATTERN = /^[A-Za-z0-9]+-\d+$/;
