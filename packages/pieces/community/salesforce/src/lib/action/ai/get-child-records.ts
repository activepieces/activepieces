import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { QueryResult, salesforceUtils } from '../../common/utils';
import { soqlQueryOutputSchema } from '../../output-schemas';

export const getChildRecords = createAction({
	auth: salesforceAuth,
	name: 'get_child_records',
	classification: 'READ',
	displayName: 'Get Child Records',
	description: 'List the related child records of a parent record.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the child records under one parent record through a child relationship name, e.g. Contacts or Opportunities on an Account, or Cases on a Contact. Relationship names come from Describe Object (childRelationships); for filtered or sorted child lookups use Run SOQL Query instead. If next_records_url is not null, fetch more with Get Next Query Page. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: soqlQueryOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Parent Object',
			description: 'Parent object API name, e.g. Account.',
			required: true,
		}),
		record_id: Property.ShortText({
			displayName: 'Parent Record ID',
			required: true,
		}),
		relationship_name: Property.ShortText({
			displayName: 'Relationship Name',
			description: 'Child relationship name, e.g. Contacts, Opportunities or My_Children__r.',
			required: true,
		}),
		fields: Property.Array({
			displayName: 'Fields',
			description: 'Child field API names to return. Leave empty for all fields.',
			required: false,
		}),
	},
	async run(context) {
		const object = salesforceUtils.assertApiName({ value: context.propsValue.object, fieldName: 'Parent Object' });
		const recordId = salesforceUtils.assertId({ value: context.propsValue.record_id, fieldName: 'Parent Record ID' });
		const relationship = salesforceUtils.assertApiName({
			value: context.propsValue.relationship_name,
			fieldName: 'Relationship Name',
		});
		const fields = salesforceUtils
			.toStringArray(context.propsValue.fields)
			.map((field) => salesforceUtils.assertApiName({ value: field, fieldName: 'Fields' }));
		const query = fields.length > 0 ? `?fields=${fields.join(',')}` : '';
		const response = await callSalesforceApi<QueryResult<unknown>>(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/sobjects/${object}/${recordId}/${relationship}${query}`,
			undefined
		);
		return salesforceUtils.formatQueryResult(response.body);
	},
});
