import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi, querySalesforceApi } from '../../common';
import { QueryResult, salesforceUtils } from '../../common/utils';
import { uploadFileOutputSchema } from '../../output-schemas';

export const uploadFile = createAction({
	auth: salesforceAuth,
	name: 'upload_file',
	classification: 'WRITE',
	displayName: 'Upload File',
	description: 'Upload a file to Salesforce Files, optionally linked to a record.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Uploads a file to Salesforce Files (creates a ContentVersion) and, when a record id is given, shares it on that record. Returns the content document id (starts with 069), which is what Get File Info, Download File and Delete File take. Not idempotent: every call uploads another file.',
		idempotent: false,
	},
	outputSchema: uploadFileOutputSchema,
	props: {
		file: Property.File({
			displayName: 'File',
			required: true,
		}),
		file_name: Property.ShortText({
			displayName: 'File Name',
			description: 'Name with extension, e.g. report.pdf. Defaults to the uploaded file name.',
			required: false,
		}),
		record_id: Property.ShortText({
			displayName: 'Record ID',
			description: 'Id of the record to attach the file to.',
			required: false,
		}),
	},
	async run(context) {
		const { file } = context.propsValue;
		const fileName = context.propsValue.file_name?.trim() || file.filename;
		const recordId = context.propsValue.record_id
			? salesforceUtils.assertId({ value: context.propsValue.record_id, fieldName: 'Record ID' })
			: undefined;
		const created = await callSalesforceApi<{ id: string; success: boolean }>(
			HttpMethod.POST,
			context.auth,
			'/services/data/v56.0/sobjects/ContentVersion',
			salesforceUtils.compact({
				Title: fileName,
				PathOnClient: fileName,
				VersionData: file.base64,
				FirstPublishLocationId: recordId,
			}),
		);
		const versionId = salesforceUtils.assertId({ value: created.body.id, fieldName: 'ContentVersion id' });
		const version = await querySalesforceApi<QueryResult<{ ContentDocumentId: string }>>(
			HttpMethod.GET,
			context.auth,
			`SELECT ContentDocumentId FROM ContentVersion WHERE Id = '${versionId}'`,
		);
		return {
			content_version_id: versionId,
			content_document_id: version.body.records[0]?.ContentDocumentId ?? null,
			title: fileName,
			record_id: recordId ?? null,
		};
	},
});
