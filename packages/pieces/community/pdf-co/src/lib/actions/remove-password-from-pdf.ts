import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const removePasswordFromPdf = createAction({
	auth: pdfCoAuth,
	name: 'remove_password_from_pdf',
	displayName: 'Remove PDF Password',
	description: 'Create an unprotected copy of a password-protected PDF.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an unprotected copy of a password-protected PDF (public URL or file) given its password; the source file is not changed. Costs 3 credits per page. Not idempotent: each call runs a new job and creates a new output.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.fileResult,
	props: {
		sourceUrl: pdfCoProps.sourceUrl(),
		sourceFile: pdfCoProps.sourceFile(),
		password: Property.ShortText({
			displayName: 'PDF Password',
			description: 'The owner or open password of the PDF.',
			required: true,
		}),
		...pdfCoProps.output(),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const password = propsValue.password;
		if (password.trim() === '') {
			throw new Error('PDF Password is required.');
		}
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		return pdfCoJobs.runFileAction({
			apiKey,
			files,
			path: '/v1/pdf/security/remove',
			body: { url, password },
			common: propsValue,
		});
	},
});
