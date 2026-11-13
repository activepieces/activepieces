import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoOutputSchemas } from '../output-schemas';

export const uploadFile = createAction({
	auth: pdfCoAuth,
	name: 'upload_file',
	displayName: 'Upload File to PDF.co',
	description: 'Upload a file to PDF.co temporary storage and get a link other PDF.co actions can use.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads a file to PDF.co temporary storage (kept for 1 hour) and returns a URL that any PDF.co action accepts as its source. Use when a PDF.co action only takes a URL and the file is not public. Costs 7 credits. Not idempotent: each call stores a new copy.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.upload,
	props: {
		file: Property.File({
			displayName: 'File',
			description: 'The file to upload, for example a PDF from an earlier step.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const { url, fileName, presigned } = await pdfCoFiles.uploadToStorage({
			apiKey: pdfCoClient.apiKeyOf(auth),
			file: propsValue.file,
		});
		return {
			url,
			name: pdfCoFiles.nonEmptyString(presigned['name']) ?? fileName,
			link_valid_until: pdfCoFiles.nonEmptyString(presigned['outputLinkValidTill']),
			credits_used: typeof presigned['credits'] === 'number' ? presigned['credits'] : undefined,
			remaining_credits: typeof presigned['remainingCredits'] === 'number' ? presigned['remainingCredits'] : undefined,
		};
	},
});
