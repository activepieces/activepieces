import { Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { googleDocsAuth, createGoogleClient } from '../auth';
import { flattenDoc } from '../common';
import { documentIdProp, documentImageIdProp } from '../common/props';

export const replaceImage = createAction({
	auth: googleDocsAuth,
	name: 'replace_image',
	displayName: 'Replace Image',
	description: 'Replace an existing image in a Google Doc with a new image URL.',
	props: {
		documentId: documentIdProp('Document', 'The Google Doc containing the image.'),
		imageObjectId: documentImageIdProp('Image', 'The image to replace.'),
		imageUrl: Property.ShortText({
			displayName: 'New Image URL',
			description: 'Publicly accessible URL of the replacement image.',
			required: true,
		}),
	},
	async run(context) {
		const { documentId, imageObjectId, imageUrl } = context.propsValue;

		const authClient = await createGoogleClient(context.auth);
		const docs = google.docs({ version: 'v1', auth: authClient });

		await docs.documents.batchUpdate({
			documentId,
			requestBody: {
				requests: [
					{
						replaceImage: {
							imageObjectId,
							uri: imageUrl,
						},
					},
				],
			},
		});

		const finalDoc = await docs.documents.get({ documentId });
		return flattenDoc(finalDoc.data);
	},
});
