import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { createSobjectRecordOutputSchema } from '../../output-schemas';

export const createSobjectRecord = createAction({
	auth: salesforceAuth,
	name: 'create_sobject_record',
	classification: 'WRITE',
	displayName: 'Create Record',
	description: 'Create one record of any object.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a single record of any Salesforce object (standard or custom) from a JSON object of field API names to values. Use it for one record; for up to 200 records in one call use Create Records Batch, and to create-or-update on an external id use Upsert Record by External ID. Required fields depend on the object (see Describe Object). Not idempotent: every call creates a new record.',
		idempotent: false,
	},
	outputSchema: createSobjectRecordOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Object',
			description: 'Object API name, e.g. Account, Contact, Lead or My_Object__c.',
			required: true,
		}),
		fields: Property.Json({
			displayName: 'Fields',
			description: 'JSON object of field API names to values, e.g. {"Name": "Acme", "Industry": "Technology"}.',
			required: true,
		}),
	},
	async run(context) {
		const object = salesforceUtils.assertApiName({ value: context.propsValue.object, fieldName: 'Object' });
		const fields = salesforceUtils.parseJsonObject({ value: context.propsValue.fields, fieldName: 'Fields' }) ?? {};
		if (Object.keys(fields).length === 0) {
			throw new Error('Fields must contain at least one field.');
		}
		const response = await callSalesforceApi<{ id: string; success: boolean }>(
			HttpMethod.POST,
			context.auth,
			`/services/data/v56.0/sobjects/${object}`,
			fields
		);
		return { id: response.body.id, success: response.body.success, object };
	},
});
