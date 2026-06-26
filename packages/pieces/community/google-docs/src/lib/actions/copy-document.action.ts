import { googleDocsAuth, createGoogleClient } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { folderIdProp } from '../common/props';

export const copyDocument = createAction({
	auth: googleDocsAuth,
	name: 'copy_document',
	displayName: 'Copy Document',
	description: 'Create a copy of an existing Google Docs document.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Duplicates an existing Google Docs document into a new file with the given title. Pick this to spin a working copy off a template or snapshot a version before editing; it is distinct from Edit Template File, which merges data in place. Each call creates a new file, so it is not idempotent (retries produce duplicates).',
		idempotent: false,
	},
	props: {
		fileId: Property.ShortText({
			displayName: 'Source Document ID',
			description:
				"The ID of the document to copy, found in its URL: 'https://docs.google.com/document/d/<documentId>/edit'.",
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'New Document Title',
			description: 'The name to give the copied document.',
			required: true,
		}),
		// Destination folder maps directly to the native Drive files.copy
		// endpoint (the requestBody.parents field), letting the copy be placed in
		// a chosen folder instead of defaulting to the source document's location.
		parents: folderIdProp,
	},
	async run(context) {
		const { fileId, title, parents } = context.propsValue;

		const authClient = await createGoogleClient(context.auth);
		const drive = googleDrive({ version: 'v3', auth: authClient });

		try {
			const response = await drive.files.copy({
				fileId,
				supportsAllDrives: true,
				fields: 'id, name, webViewLink, parents',
				requestBody: {
					name: title,
					...(parents ? { parents: [parents] } : {}),
				},
			});

			return {
				id: response.data.id ?? '',
				name: response.data.name ?? '',
				webViewLink: response.data.webViewLink ?? '',
				parents: response.data.parents ?? [],
			};
		} catch (e) {
			const error = e as { code?: number; message?: string };
			if (error.code === 403) {
				throw new Error(
					'Permission denied copying the document. Ensure the connected account has access to the source document and the destination folder.'
				);
			}
			if (error.code === 404) {
				throw new Error(
					`Source document not found for ID '${fileId}'. Verify the document ID.`
				);
			}
			throw e;
		}
	},
});
