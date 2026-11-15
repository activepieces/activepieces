import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { updateRecordOutputSchema } from '../../output-schemas';

export const updateSobjectRecord = createAction({
	auth: salesforceAuth,
	name: 'update_sobject_record',
	classification: 'WRITE',
	displayName: 'Update Record',
	description: 'Update fields on one record of any object.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates a single record of any Salesforce object by id; only the field API names you send change, every other field stays untouched (send null to clear a field). Use it when you have the record id; to match on an external id instead use Upsert Record by External ID, and for many records use Upsert Records Batch. Idempotent: resending the same values leaves the record in the same state.',
		idempotent: true,
	},
	outputSchema: updateRecordOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Object',
			description: 'Object API name, e.g. Account, Contact or My_Object__c.',
			required: true,
		}),
		record_id: Property.ShortText({
			displayName: 'Record ID',
			required: true,
		}),
		fields: Property.Json({
			displayName: 'Fields',
			description: 'JSON object of field API names to new values. Only these fields change; use null to clear a field.',
			required: true,
		}),
	},
	async run(context) {
		const object = salesforceUtils.assertApiName({ value: context.propsValue.object, fieldName: 'Object' });
		const recordId = salesforceUtils.assertId({ value: context.propsValue.record_id, fieldName: 'Record ID' });
		const fields = salesforceUtils.parseJsonObject({ value: context.propsValue.fields, fieldName: 'Fields' }) ?? {};
		const fieldNames = Object.keys(fields);
		if (fieldNames.length === 0) {
			throw new Error('Fields must contain at least one field to update.');
		}
		await callSalesforceApi(
			HttpMethod.PATCH,
			context.auth,
			`/services/data/v56.0/sobjects/${object}/${recordId}`,
			fields
		);
		return { id: recordId, success: true, updated_fields: fieldNames };
	},
});
