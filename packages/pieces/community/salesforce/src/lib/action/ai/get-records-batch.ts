import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { recordsUtils } from '../../common/records';
import { getRecordsBatchOutputSchema } from '../../output-schemas';

export const getRecordsBatch = createAction({
	auth: salesforceAuth,
	name: 'get_records_batch',
	classification: 'READ',
	displayName: 'Get Records Batch',
	description: 'Get up to 2000 records of one object by their ids.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns up to 2000 records of one Salesforce object by id in a single call, with the fields you list (at least one field is required). Use it instead of calling Get Record repeatedly; to find records by criteria use Run SOQL Query. Ids that do not exist come back as null entries in the same position, so the output stays aligned with the input. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: getRecordsBatchOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Object',
			description: 'Object API name, e.g. Account, Contact or My_Object__c.',
			required: true,
		}),
		record_ids: Property.Array({
			displayName: 'Record IDs',
			description: 'Up to 2000 record ids of this object.',
			required: true,
		}),
		fields: Property.Array({
			displayName: 'Fields',
			description: 'Field API names to return, e.g. Id, Name. At least one is required.',
			required: true,
		}),
	},
	async run(context) {
		const object = salesforceUtils.assertApiName({ value: context.propsValue.object, fieldName: 'Object' });
		const ids = recordsUtils.parseIdList({ value: context.propsValue.record_ids, fieldName: 'Record IDs', max: MAX_IDS });
		const fields = salesforceUtils
			.toStringArray(context.propsValue.fields)
			.map((field) => salesforceUtils.assertApiName({ value: field, fieldName: 'Fields' }));
		if (fields.length === 0) {
			throw new Error('Fields must contain at least one field API name.');
		}
		const response = await callSalesforceApi<unknown[]>(
			HttpMethod.POST,
			context.auth,
			`/services/data/v56.0/composite/sobjects/${object}`,
			{ ids, fields }
		);
		const records = response.body.map((record, index) => ({
			requested_id: ids[index],
			found: record !== null,
			record: salesforceUtils.cleanRecord(record),
		}));
		return {
			records,
			count: records.length,
			found_count: records.filter((record) => record.found).length,
		};
	},
});

const MAX_IDS = 2000;
