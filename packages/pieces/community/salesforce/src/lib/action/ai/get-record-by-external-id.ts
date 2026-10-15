import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { recordOutputSchema } from '../../output-schemas';

export const getRecordByExternalId = createAction({
	auth: salesforceAuth,
	name: 'get_record_by_external_id',
	classification: 'READ',
	displayName: 'Get Record by External ID',
	description: 'Get one record by the value of an external id field.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns a single Salesforce record matched on an external id field (a field marked External ID or unique, e.g. My_Ext_Id__c) instead of the Salesforce id. Use it when you know an id from another system; if you have the Salesforce id use Get Record. Fails with 404 when nothing matches and 300 when several records match. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: recordOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Object',
			description: 'Object API name, e.g. Account or My_Object__c.',
			required: true,
		}),
		external_id_field: Property.ShortText({
			displayName: 'External ID Field',
			description: 'API name of the external id field, e.g. My_Ext_Id__c.',
			required: true,
		}),
		external_id_value: Property.ShortText({
			displayName: 'External ID Value',
			required: true,
		}),
		fields: Property.Array({
			displayName: 'Fields',
			description: 'Field API names to return. Leave empty for all fields.',
			required: false,
		}),
	},
	async run(context) {
		const object = salesforceUtils.assertApiName({ value: context.propsValue.object, fieldName: 'Object' });
		const externalField = salesforceUtils.assertApiName({
			value: context.propsValue.external_id_field,
			fieldName: 'External ID Field',
		});
		const value = context.propsValue.external_id_value.trim();
		if (value.length === 0) {
			throw new Error('External ID Value is required.');
		}
		const fields = salesforceUtils
			.toStringArray(context.propsValue.fields)
			.map((field) => salesforceUtils.assertApiName({ value: field, fieldName: 'Fields' }));
		const query = fields.length > 0 ? `?fields=${fields.join(',')}` : '';
		const response = await callSalesforceApi(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/sobjects/${object}/${externalField}/${encodeURIComponent(value)}${query}`,
			undefined
		);
		return salesforceUtils.cleanRecord(response.body);
	},
});
