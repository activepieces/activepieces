import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { CompositeResult, recordsUtils } from '../../common/records';
import { compositeBatchOutputSchema } from '../../output-schemas';

export const createRecordsBatch = createAction({
	auth: salesforceAuth,
	name: 'create_records_batch',
	classification: 'WRITE',
	displayName: 'Create Records Batch',
	description: 'Create up to 200 records of one object in one call.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates up to 200 records of one Salesforce object in a single call and returns a per-record result (id or error) in input order. Use it instead of repeated Create Record calls; to create parents with nested children use Create Record Tree, and to avoid duplicates on an external id use Upsert Records Batch. With All or None on, one failure rolls back the whole batch. Not idempotent: every call creates new records.',
		idempotent: false,
	},
	outputSchema: compositeBatchOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Object',
			description: 'Object API name, e.g. Account, Contact or My_Object__c.',
			required: true,
		}),
		records: Property.Json({
			displayName: 'Records',
			description: 'JSON array of up to 200 objects of field API names to values, e.g. [{"Name": "Acme"}, {"Name": "Globex"}].',
			required: true,
		}),
		all_or_none: Property.Checkbox({
			displayName: 'All or None',
			description: 'Roll back every record if any record fails.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const object = salesforceUtils.assertApiName({ value: context.propsValue.object, fieldName: 'Object' });
		const records = recordsUtils.parseRecordList({
			value: context.propsValue.records,
			fieldName: 'Records',
			max: recordsUtils.MAX_COMPOSITE_RECORDS,
		});
		const response = await callSalesforceApi<CompositeResult[]>(
			HttpMethod.POST,
			context.auth,
			'/services/data/v56.0/composite/sobjects',
			{
				allOrNone: context.propsValue.all_or_none ?? false,
				records: records.map((record) => ({ ...record, attributes: { type: object } })),
			}
		);
		return recordsUtils.formatCompositeResults(response.body);
	},
});
