import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const insertPageBreak = createAction({
	auth: googleDocsAuth,
	name: 'insert_page_break',
	displayName: 'Insert Page Break',
	description: 'Insert a page break into a Google Docs document at a position or at the end.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Inserts a page break into a Google Docs document. If "index" is omitted the page break is appended at the end of the document body; if "index" is provided it is inserted at that character index — obtain a valid index from Get Document End Index first (indices cannot be guessed and must fall inside an existing paragraph). Not idempotent: each call inserts another page break.',
		idempotent: false,
	},
	props: {
		documentId: Property.ShortText({
			displayName: 'Document ID',
			description: 'The ID of the document to insert the page break into.',
			required: true,
		}),
		index: Property.Number({
			displayName: 'Index',
			description:
				'Character index at which to insert the page break. Leave empty to insert at the end of the document. Obtain a valid index from Get Document End Index.',
			required: false,
		}),
	},
	async run(context) {
		const { documentId, index } = context.propsValue;
		const authClient = await createGoogleClient(context.auth);
		const docs = googleDocs({ version: 'v1', auth: authClient });

		const request: docs_v1.Schema$Request =
			index === undefined || index === null
				? { insertPageBreak: { endOfSegmentLocation: {} } }
				: { insertPageBreak: { location: { index } } };

		try {
			await docs.documents.batchUpdate({
				documentId,
				requestBody: { requests: [request] },
			});
			return {
				success: true,
				documentId,
				mode: index === undefined || index === null ? 'append' : 'insert_at_index',
			};
		} catch (error) {
			throw new Error(docsCommon.formatError(error, 'insert page break into'));
		}
	},
});
