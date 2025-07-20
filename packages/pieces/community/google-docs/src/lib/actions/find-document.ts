import { googleDocsAuth } from '../..';
import {
	createAction,
	DynamicPropsValue,
	Property,
} from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { folderIdProp } from '../common/props';

export const findDocumentAction = createAction({
	auth: googleDocsAuth,
	name: 'google-docs-find-document',
	displayName: 'Find Document',
	description: 'Search for document by name.',
	props: {
		name: Property.ShortText({
			displayName: 'Document Name',
			required: true,
		}),
		folderId: folderIdProp,
		createIfNotFound: Property.Checkbox({
			displayName: 'Create a new document if not found?',
			defaultValue: false,
			required: false,
		}),
		newDocumentProps: Property.DynamicProperties({
			displayName: 'New Document Properties',
			required: false,
			refreshers: ['createIfNotFound'],
			props: async ({ auth, createIfNotFound }) => {
				if (!auth) return {};
				if (!createIfNotFound) return {};

				const props: DynamicPropsValue = {};

				if (createIfNotFound) {
					props['content'] = Property.LongText({
						displayName: 'Document Content',
						required: true,
					});
				}

				return props;
			},
		}),
	},
	async run(context) {
		const { name: documentName, folderId, createIfNotFound, newDocumentProps } = context.propsValue;
		const newDocumentContent = newDocumentProps?.['content'] as string;

		const authClient = new OAuth2Client();
		authClient.setCredentials(context.auth);

		const drive = google.drive({ version: 'v3', auth: authClient });
		const docs = google.docs({ version: 'v1', auth: authClient });

		// Search for the document in Google Drive
		const query: string[] = [
			`name contains '${documentName}'`,
			`mimeType='application/vnd.google-apps.document'`,
			'trashed=false',
		];

		if (folderId) query.push(`'${folderId}' in parents`);

		const response = await drive.files.list({
			q: query.join(' and '),
			supportsAllDrives: true,
			fields: '*',
			pageSize: 1,
			includeItemsFromAllDrives: true,
		});

		const existingFile = response.data.files?.[0];

		if (existingFile) {
			return { found: true, file: existingFile };
		}

		// Create a new document if not found
		if (!createIfNotFound) return { found: false, file: {} };

		//creating new Document
		const createdDoc = await docs.documents.create({ requestBody: { title: documentName } });
		const documentId = createdDoc.data.documentId;

		if (!documentId) throw new Error('Failed to create document');

		// Insert content into the new document
		if (newDocumentContent) {
			// appending text
			await docs.documents.batchUpdate({
				documentId,
				requestBody: {
					requests: [{ insertText: { text: newDocumentContent, endOfSegmentLocation: {} } }],
				},
			});
		}

		// Move the document to the specified folder
		if (folderId) {
			const fileData = await drive.files.get({
				fileId: documentId,
				supportsAllDrives: true,
				fields: 'id, parents',
			});

			await drive.files.update({
				fileId: documentId,
				fields: 'id, name, parents',
				removeParents: fileData.data.parents?.join(','),
				addParents: folderId,
				supportsAllDrives: true,
			});
		}

		// Fetch document details
		const finalFile = await drive.files.get({
			fileId: documentId,
			supportsAllDrives: true,
			fields: '*',
		});

		return { found: false, file: finalFile.data };
	},
});
