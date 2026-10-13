import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { getUpdatedRecordIdsOutputSchema } from '../../output-schemas';

export const getUpdatedRecordIds = createAction({
	auth: salesforceAuth,
	name: 'get_updated_record_ids',
	classification: 'READ',
	displayName: 'Get Updated Record IDs',
	description: 'List ids of records of one object changed in a time window.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the ids of records of one Salesforce object that were created or updated between a start and end time, plus the latest time covered. Use it for incremental sync; to fetch the records afterwards use Get Records Batch, and to filter on other criteria use Run SOQL Query. The window must fall within the last 30 days; times are UTC at minute precision. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: getUpdatedRecordIdsOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Object',
			description: 'Object API name, e.g. Account or My_Object__c.',
			required: true,
		}),
		start: Property.DateTime({
			displayName: 'Start',
			description: 'ISO 8601 start time, within the last 30 days, e.g. 2026-09-01T00:00:00Z.',
			required: true,
		}),
		end: Property.DateTime({
			displayName: 'End',
			description: 'ISO 8601 end time. Defaults to now.',
			required: false,
		}),
	},
	async run(context) {
		const object = salesforceUtils.assertApiName({ value: context.propsValue.object, fieldName: 'Object' });
		const start = toSalesforceDate({ value: context.propsValue.start, fieldName: 'Start' });
		const end = toSalesforceDate({ value: context.propsValue.end ?? new Date().toISOString(), fieldName: 'End' });
		const response = await callSalesforceApi<{ ids: string[]; latestDateCovered: string }>(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/sobjects/${object}/updated/?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
			undefined
		);
		return {
			ids: response.body.ids,
			count: response.body.ids.length,
			latest_date_covered: response.body.latestDateCovered,
		};
	},
});

function toSalesforceDate({ value, fieldName }: { value: string; fieldName: string }): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`${fieldName} must be an ISO 8601 date-time.`);
	}
	return date.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}
