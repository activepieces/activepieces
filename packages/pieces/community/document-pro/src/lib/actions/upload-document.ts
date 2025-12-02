import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { documentProAuth } from '../common/auth';
import FormData from 'form-data';

const MAX_REGULAR_UPLOAD_SIZE = 6 * 1024 * 1024; // 6MB in bytes

export const uploadDocument = createAction({
	auth: documentProAuth,
	name: 'upload_document',
	displayName: 'Upload Document',
	description: 'Uploads a document to DocumentPro for parsing. Supports files up to 6MB directly, or larger files via multi-step upload.',
	props: {
		file: Property.File({
			displayName: 'File',
			description: 'The document file to upload (PDF, JPEG, PNG, or TIFF)',
			required: true,
		}),
	},
	async run(context) {
		const file = context.propsValue.file;
		const apiKey = context.auth;
		const fileSize = file.data.byteLength;

		// Regular upload for files <= 6MB
		if (fileSize <= MAX_REGULAR_UPLOAD_SIZE) {
			const formData = new FormData();
			formData.append('file', Buffer.from(file.data), file.filename);

			const response = await httpClient.sendRequest({
				method: HttpMethod.POST,
				url: 'https://api.documentpro.ai/v1/documents',
				headers: {
					'x-api-key': apiKey,
					...formData.getHeaders(),
				},
				body: formData,
			});

			return response.body;
		}

		// Large file upload (multi-step process)
		// Step 1: Get upload URL
		const uploadUrlResponse = await httpClient.sendRequest<{
			upload_url: string;
			document_id: string;
		}>({
			method: HttpMethod.GET,
			url: 'https://api.documentpro.ai/v1/documents/upload_url',
			headers: {
				'x-api-key': apiKey,
				Accept: 'application/json',
			},
			queryParams: {
				file_name: file.filename,
			},
		});

		const { upload_url, document_id } = uploadUrlResponse.body;

		// Step 2: Upload file to pre-signed URL
		await httpClient.sendRequest({
			method: HttpMethod.PUT,
			url: upload_url,
			headers: {
				'Content-Type': getContentType(file.filename),
			},
			body: Buffer.from(file.data),
		});

		// Step 3: Confirm upload
		const confirmResponse = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://api.documentpro.ai/v1/documents',
			headers: {
				'x-api-key': apiKey,
				'Content-Type': 'application/json',
			},
			body: {
				document_id,
				file_name: file.filename,
			},
		});

		return confirmResponse.body;
	},
});

function getContentType(filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase();
	switch (ext) {
		case 'pdf':
			return 'application/pdf';
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg';
		case 'png':
			return 'image/png';
		case 'tiff':
		case 'tif':
			return 'image/tiff';
		default:
			return 'application/octet-stream';
	}
}

