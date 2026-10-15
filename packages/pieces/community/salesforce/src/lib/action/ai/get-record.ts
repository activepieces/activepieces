import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { recordOutputSchema } from '../../output-schemas';

export const getRecord = createAction({
	auth: salesforceAuth,
	name: 'get_record',
	classification: 'READ',
	displayName: 'Get Record',
	description: 'Get one record of any object by its id.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns a single Salesforce record of any object (Account, Contact, Lead, Opportunity, Case, custom objects…) by its 15- or 18-character id, with all fields or only the ones you list. Use it after a search or query returned an id; to fetch many records of one object at once use Get Records Batch. Field and object names are API names from Describe Object. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: recordOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Object',
			description: 'Object API name, e.g. Account, Contact, Opportunity or My_Object__c.',
			required: true,
		}),
		record_id: Property.ShortText({
			displayName: 'Record ID',
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
		const recordId = salesforceUtils.assertId({ value: context.propsValue.record_id, fieldName: 'Record ID' });
		const fields = salesforceUtils
			.toStringArray(context.propsValue.fields)
			.map((field) => salesforceUtils.assertApiName({ value: field, fieldName: 'Fields' }));
		const query = fields.length > 0 ? `?fields=${fields.join(',')}` : '';
		const response = await callSalesforceApi(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/sobjects/${object}/${recordId}${query}`,
			undefined
		);
		return salesforceUtils.cleanRecord(response.body);
	},
});
