import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { deletedRecordOutputSchema } from '../../output-schemas';

export const deleteFile = createAction({
	auth: salesforceAuth,
	name: 'delete_file',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete File',
	description: 'Delete a Salesforce file and all its versions.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes a Salesforce File, all of its versions and its links to records, by its content document id (starts with 069). Destructive: confirm the id with Get File Info first; the file goes to the Recycle Bin and disappears from every record it was shared on. Not idempotent: a second call fails because the file no longer exists.',
		idempotent: false,
	},
	outputSchema: deletedRecordOutputSchema,
	props: {
		content_document_id: Property.ShortText({
			displayName: 'Content Document ID',
			description: 'File id starting with 069.',
			required: true,
		}),
	},
	async run(context) {
		const id = salesforceUtils.assertId({
			value: context.propsValue.content_document_id,
			fieldName: 'Content Document ID',
		});
		await callSalesforceApi(HttpMethod.DELETE, context.auth, `/services/data/v56.0/connect/files/${id}`, undefined);
		return { id, deleted: true };
	},
});
