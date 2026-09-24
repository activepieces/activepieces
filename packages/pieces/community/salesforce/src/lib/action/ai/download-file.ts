import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { downloadFileOutputSchema } from '../../output-schemas';

export const downloadFile = createAction({
	auth: salesforceAuth,
	name: 'download_file',
	classification: 'READ',
	displayName: 'Download File',
	description: 'Download the content of a Salesforce file.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Downloads the latest version of a Salesforce File by its content document id (starts with 069) and returns it as a file reference with its name, size and MIME type. Use Get File Info when you only need metadata. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: downloadFileOutputSchema,
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
		const info = await callSalesforceApi<{ title: string; fileExtension?: string; mimeType?: string }>(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/connect/files/${id}`,
			undefined,
		);
		const content = await callSalesforceApi<ArrayBuffer>(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/connect/files/${id}/content`,
			undefined,
			{ responseType: 'arraybuffer' },
		);
		const fileName = buildFileName({ title: info.body.title, extension: info.body.fileExtension });
		const data = Buffer.from(content.body);
		return {
			file: await context.files.write({ fileName, data }),
			file_name: fileName,
			size: data.length,
			mime_type: info.body.mimeType ?? null,
		};
	},
});

function buildFileName({ title, extension }: { title: string; extension: string | undefined }): string {
	if (!extension || title.toLowerCase().endsWith(`.${extension.toLowerCase()}`)) {
		return title;
	}
	return `${title}.${extension}`;
}
