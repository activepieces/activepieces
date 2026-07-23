import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const replaceImage = createAction({
	auth: googleDocsAuth,
	name: 'replace_image',
	displayName: 'Replace Image',
	description: 'Replace an existing inline image in a Google Docs document with a new image from a URI.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Swaps an existing inline image (identified by its object ID) for a new image at the given URI. Use this to update a specific image in a document without altering surrounding content. The imageObjectId must come from the document\'s inlineObjects map — obtain it by calling Read Document first. Re-running with the same URI leaves the document in the same visual state, so it is idempotent.',
		idempotent: true,
	},
	props: {
		documentId: Property.ShortText({
			displayName: 'Document ID',
			description: 'The ID of the document containing the image to replace.',
			required: true,
		}),
		imageObjectId: Property.ShortText({
			displayName: 'Image Object ID',
			description:
				'The object ID of the inline image to replace. This is a hidden ID found in the document\'s inlineObjects map — obtain it by calling Read Document and inspecting the inlineObjects field.',
			required: true,
		}),
		uri: Property.ShortText({
			displayName: 'New Image URI',
			description: 'A publicly accessible URL of the replacement image. Google must be able to fetch this URL at the time of the call.',
			required: true,
		}),
	},
	async run(context) {
		const { documentId, imageObjectId, uri } = context.propsValue;
		const authClient = await createGoogleClient(context.auth);
		const docs = googleDocs({ version: 'v1', auth: authClient });

		const request: docs_v1.Schema$Request = {
			replaceImage: {
				imageObjectId,
				uri,
				imageReplaceMethod: 'CENTER_CROP',
			},
		};

		try {
			await docs.documents.batchUpdate({
				documentId,
				requestBody: { requests: [request] },
			});
			return { success: true, documentId, imageObjectId };
		} catch (error) {
			throw new Error(docsCommon.formatError(error, 'replace image in'));
		}
	},
});
