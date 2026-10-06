import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { listListViewsOutputSchema } from '../../output-schemas';

export const listListViews = createAction({
	auth: salesforceAuth,
	name: 'list_list_views',
	classification: 'READ',
	displayName: 'List List Views',
	description: 'List the list views defined for an object.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the list views of one object (e.g. "My Open Opportunities" on Opportunity) with their ids. Pass an id to Get List View Metadata to see its columns and SOQL, or to Get List View Records to read its rows. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: listListViewsOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Object',
			description: 'Object API name, e.g. Account or Opportunity.',
			required: true,
		}),
	},
	async run(context) {
		const object = salesforceUtils.assertApiName({ value: context.propsValue.object, fieldName: 'Object' });
		const response = await callSalesforceApi(HttpMethod.GET, context.auth, `/services/data/v56.0/sobjects/${object}/listviews`, undefined);
		const body: unknown = response.body;
		const listViews = (salesforceUtils.isRecord(body) && Array.isArray(body['listviews']) ? body['listviews'] : [])
			.filter(salesforceUtils.isRecord)
			.map((view) => ({
				id: view['id'] ?? null,
				label: view['label'] ?? null,
				developer_name: view['developerName'] ?? null,
				soql_compatible: view['soqlCompatible'] ?? null,
				results_url: view['resultsUrl'] ?? null,
			}));
		return { list_views: listViews, count: listViews.length };
	},
});
