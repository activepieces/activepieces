import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { getRecordCountsOutputSchema } from '../../output-schemas';

export const getRecordCounts = createAction({
	auth: salesforceAuth,
	name: 'get_record_counts',
	classification: 'READ',
	displayName: 'Get Record Counts',
	description: 'Get approximate record counts per object.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the approximate number of records stored for each listed object (or every object when none are listed), as used for org storage. Use it for a quick size overview; counts are refreshed periodically and can lag, so for an exact filtered count use Run SOQL Query with SELECT COUNT(). Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: getRecordCountsOutputSchema,
	props: {
		objects: Property.Array({
			displayName: 'Objects',
			description: 'Object API names to count, e.g. Account, Contact. Leave empty for all objects.',
			required: false,
		}),
	},
	async run(context) {
		const objects = salesforceUtils
			.toStringArray(context.propsValue.objects)
			.map((object) => salesforceUtils.assertApiName({ value: object, fieldName: 'Objects' }));
		const query = objects.length > 0 ? `?sObjects=${objects.join(',')}` : '';
		const response = await callSalesforceApi<{ sObjects: { name: string; count: number }[] }>(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/limits/recordCount${query}`,
			undefined
		);
		const counts = response.body.sObjects.map((item) => ({ name: item.name, count: item.count }));
		return { counts, count: counts.length };
	},
});
