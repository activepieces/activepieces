import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { docs as googleDocs } from '@googleapis/docs';

export const exportAsPdf = createAction({
	auth: googleDocsAuth,
	name: 'export_as_pdf',
	displayName: 'Export as PDF',
	description: 'Export a Google Docs document as a PDF file.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Exports a Google Docs document as a PDF and returns the file for use in later steps (e.g. sending via email or uploading to storage). Uses the Drive export endpoint, so the document must not exceed the Drive 10 MB export limit. Read-only and idempotent — it never modifies the document.',
		idempotent: true,
	},
	props: {
		documentId: Property.ShortText({
			displayName: 'Document ID',
			description: 'The ID of the document to export as PDF.',
			required: true,
		}),
	},
	async run(context) {
		const { documentId } = context.propsValue;
		const authClient = await createGoogleClient(context.auth);

		// Fetch document title for the file name
		const docs = googleDocs({ version: 'v1', auth: authClient });
		let title = documentId;
		try {
			const docResponse = await docs.documents.get({ documentId, fields: 'title' });
			title = docResponse.data.title ?? documentId;
		} catch {
			// Fall back to documentId as the file name if the title fetch fails
		}

		const drive = googleDrive({ version: 'v3', auth: authClient });

		try {
			const response = await drive.files.export(
				{ fileId: documentId, mimeType: 'application/pdf' },
				{ responseType: 'arraybuffer' }
			);

			const file = await context.files.write({
				fileName: `${title}.pdf`,
				data: Buffer.from(response.data as ArrayBuffer),
			});

			return { success: true, documentId, file };
		} catch (error) {
			throw new Error(docsCommon.formatError(error, 'export'));
		}
	},
});
