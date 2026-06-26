import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const insertInlineImage = createAction({
	auth: googleDocsAuth,
	name: 'insert_inline_image',
	displayName: 'Insert Inline Image',
	description: 'Insert an inline image into a Google Docs document at a position or at the end.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Inserts an inline image from a publicly fetchable URI into a Google Docs document. If "index" is omitted the image is placed at the end of the document body; if "index" is provided it is inserted at that character index — obtain a valid index from Get Document End Index first (indices cannot be guessed). The URI must be publicly accessible by Google at call time. Not idempotent: each call inserts another copy of the image.',
		idempotent: false,
	},
	props: {
		documentId: Property.ShortText({
			displayName: 'Document ID',
			description: 'The ID of the document to insert the image into.',
			required: true,
		}),
		uri: Property.ShortText({
			displayName: 'Image URI',
			description: 'A publicly accessible URL of the image to insert. Google must be able to fetch this URL at the time of the call.',
			required: true,
		}),
		index: Property.Number({
			displayName: 'Index',
			description:
				'Character index at which to insert the image. Leave empty to insert at the end of the document. Obtain a valid index from Get Document End Index.',
			required: false,
		}),
		widthPt: Property.Number({
			displayName: 'Width (pt)',
			description: 'Desired width of the image in points. Leave empty to use the image\'s natural size.',
			required: false,
		}),
		heightPt: Property.Number({
			displayName: 'Height (pt)',
			description: 'Desired height of the image in points. Leave empty to use the image\'s natural size.',
			required: false,
		}),
	},
	async run(context) {
		const { documentId, uri, index, widthPt, heightPt } = context.propsValue;
		const authClient = await createGoogleClient(context.auth);
		const docs = googleDocs({ version: 'v1', auth: authClient });

		const objectSize: docs_v1.Schema$Size | undefined =
			widthPt !== undefined && widthPt !== null && heightPt !== undefined && heightPt !== null
				? {
						width: { magnitude: widthPt, unit: 'PT' },
						height: { magnitude: heightPt, unit: 'PT' },
					}
				: undefined;

		const location: docs_v1.Schema$InsertInlineImageRequest =
			index === undefined || index === null
				? { uri, endOfSegmentLocation: {}, ...(objectSize ? { objectSize } : {}) }
				: { uri, location: { index }, ...(objectSize ? { objectSize } : {}) };

		const request: docs_v1.Schema$Request = { insertInlineImage: location };

		try {
			const response = await docs.documents.batchUpdate({
				documentId,
				requestBody: { requests: [request] },
			});
			const insertedObjectId = response.data.replies?.[0]?.insertInlineImage?.objectId ?? null;
			return {
				success: true,
				documentId,
				insertedObjectId,
				mode: index === undefined || index === null ? 'append' : 'insert_at_index',
			};
		} catch (error) {
			throw new Error(docsCommon.formatError(error, 'insert inline image into'));
		}
	},
});
