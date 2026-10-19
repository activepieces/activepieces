import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { getFileInfoOutputSchema } from '../../output-schemas';

export const getFileInfo = createAction({
	auth: salesforceAuth,
	name: 'get_file_info',
	classification: 'READ',
	displayName: 'Get File Info',
	description: 'Get the details of a Salesforce file.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the metadata of a Salesforce File (title, extension, type, size, MIME type, owner, dates, version) by its content document id (starts with 069). Use it to inspect a file; to get the bytes use Download File. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: getFileInfoOutputSchema,
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
		const response = await callSalesforceApi<ConnectFile>(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/connect/files/${id}`,
			undefined,
		);
		const file = response.body;
		return {
			id: file.id,
			title: file.title,
			name: file.name ?? null,
			file_extension: file.fileExtension ?? null,
			file_type: file.fileType ?? null,
			content_size: file.contentSize ?? null,
			mime_type: file.mimeType ?? null,
			owner_id: file.owner?.id ?? null,
			owner_name: file.owner?.displayName ?? file.owner?.name ?? null,
			created_date: file.createdDate ?? null,
			modified_date: file.modifiedDate ?? null,
			version_number: file.versionNumber ?? null,
			download_url: file.downloadUrl ?? null,
		};
	},
});

type ConnectFile = {
	id: string;
	title: string;
	name?: string;
	fileExtension?: string;
	fileType?: string;
	contentSize?: number;
	mimeType?: string;
	owner?: { id?: string; displayName?: string; name?: string };
	createdDate?: string;
	modifiedDate?: string;
	versionNumber?: string;
	downloadUrl?: string;
};
