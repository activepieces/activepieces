import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { CompositeResult, recordsUtils } from '../../common/records';
import { upsertRecordsBatchOutputSchema } from '../../output-schemas';

export const upsertRecordsBatch = createAction({
	auth: salesforceAuth,
	name: 'upsert_records_batch',
	classification: 'WRITE',
	displayName: 'Upsert Records Batch',
	description: 'Create or update up to 200 records matched on an external id field.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates or updates up to 200 records of one Salesforce object in a single call, matching each on an external id field, and returns a per-record result with a created flag in input order. Use it to sync many records from another system; for one record use Upsert Record by External ID. Every record must include the external id field. Idempotent on the external id: rerunning updates rather than duplicates.',
		idempotent: true,
	},
	outputSchema: upsertRecordsBatchOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Object',
			description: 'Object API name, e.g. Account or My_Object__c.',
			required: true,
		}),
		external_id_field: Property.ShortText({
			displayName: 'External ID Field',
			description: 'API name of the external id field used to match, e.g. My_Ext_Id__c.',
			required: true,
		}),
		records: Property.Json({
			displayName: 'Records',
			description: 'JSON array of up to 200 objects; each must include the external id field, e.g. [{"My_Ext_Id__c": "A-1", "Name": "Acme"}].',
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
		const externalField = salesforceUtils.assertApiName({
			value: context.propsValue.external_id_field,
			fieldName: 'External ID Field',
		});
		const records = recordsUtils.parseRecordList({
			value: context.propsValue.records,
			fieldName: 'Records',
			max: recordsUtils.MAX_COMPOSITE_RECORDS,
		});
		const missing = records.findIndex((record) => isNil(record[externalField]) || record[externalField] === '');
		if (missing !== -1) {
			throw new Error(`Records[${missing}] is missing the external id field ${externalField}.`);
		}
		const response = await callSalesforceApi<CompositeResult[]>(
			HttpMethod.PATCH,
			context.auth,
			`/services/data/v56.0/composite/sobjects/${object}/${externalField}`,
			{
				allOrNone: context.propsValue.all_or_none ?? false,
				records: records.map((record) => ({ ...record, attributes: { type: object } })),
			}
		);
		return recordsUtils.formatCompositeResults(response.body);
	},
});
