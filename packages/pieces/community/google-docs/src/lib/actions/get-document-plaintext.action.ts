import { googleDocsAuth, createGoogleClient } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

// Minimal prose projection: only top-level body paragraph text runs are
// flattened. Content inside tables, headers, footers, footnotes, and tabs is
// intentionally NOT included — keep the contract unambiguous for agents that
// just want the document prose. Use read_document for the full structural JSON.
function flattenBodyToPlainText(body: docs_v1.Schema$Body | undefined): string {
	const lines: string[] = [];
	for (const element of body?.content ?? []) {
		const paragraph = element.paragraph;
		if (!paragraph) continue;
		const text = (paragraph.elements ?? [])
			.map((paragraphElement) => paragraphElement.textRun?.content ?? '')
			.join('');
		lines.push(text);
	}
	return lines.join('').replace(/\n+$/, '');
}

export const getDocumentPlaintext = createAction({
	auth: googleDocsAuth,
	name: 'get_document_plaintext',
	displayName: 'Get Document Plain Text',
	description: 'Get the plain text content of a Google Docs document.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns just the body prose of a Google Docs document as a plain string, flattened from the document.get response. Pick this over Read Document when you only need the text to summarize/extract/classify and want to avoid the large nested structural JSON. Only top-level paragraph text is included — tables, headers, footers, footnotes, and tabs are omitted. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		documentId: Property.ShortText({
			displayName: 'Document ID',
			description:
				"The ID of the document to read, found in its URL: 'https://docs.google.com/document/d/<documentId>/edit'. Obtain it from Search Documents or Find Document if you only have a name.",
			required: true,
		}),
	},
	async run(context) {
		const authClient = await createGoogleClient(context.auth);
		const docs = googleDocs({ version: 'v1', auth: authClient });

		try {
			const response = await docs.documents.get({
				documentId: context.propsValue.documentId,
			});

			const plainText = flattenBodyToPlainText(response.data.body);

			return {
				documentId: response.data.documentId ?? context.propsValue.documentId,
				title: response.data.title ?? '',
				plainText,
			};
		} catch (e) {
			const error = e as { code?: number; message?: string };
			if (error.code === 403) {
				throw new Error(
					'Permission denied reading the document. Ensure the connected account has access to this document.'
				);
			}
			if (error.code === 404) {
				throw new Error(
					`Document not found for ID '${context.propsValue.documentId}'. Verify the document ID.`
				);
			}
			throw e;
		}
	},
});
