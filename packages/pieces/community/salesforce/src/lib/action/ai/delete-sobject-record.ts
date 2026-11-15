import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { deletedRecordOutputSchema } from '../../output-schemas';

export const deleteSobjectRecord = createAction({
	auth: salesforceAuth,
	name: 'delete_sobject_record',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Record',
	description: 'Delete one record of any object.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes a single record of any Salesforce object by id; the record goes to the Recycle Bin (recoverable for about 15 days) and cascade-deletes master-detail children. For up to 200 ids in one call use Delete Records Batch. Not idempotent: a second call on the same id fails because the record is already deleted.',
		idempotent: false,
	},
	outputSchema: deletedRecordOutputSchema,
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
	},
	async run(context) {
		const object = salesforceUtils.assertApiName({ value: context.propsValue.object, fieldName: 'Object' });
		const recordId = salesforceUtils.assertId({ value: context.propsValue.record_id, fieldName: 'Record ID' });
		await callSalesforceApi(
			HttpMethod.DELETE,
			context.auth,
			`/services/data/v56.0/sobjects/${object}/${recordId}`,
			undefined
		);
		return { id: recordId, deleted: true };
	},
});
