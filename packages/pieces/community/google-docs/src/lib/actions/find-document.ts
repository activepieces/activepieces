import { googleDocsAuth, createGoogleClient } from '../auth';
import {
	createAction,
	DynamicPropsValue,
	Property,
} from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { folderIdProp } from '../common/props';
import { flattenDriveFile, moveFileToFolder } from '../common';

export const findDocumentAction = createAction({
	auth: googleDocsAuth,
	name: 'google-docs-find-document',
	displayName: 'Find Document',
	description: 'Search for a Google Doc by name, optionally within a specific folder. Can create a new document if none is found.',
	props: {
		name: Property.ShortText({
			displayName: 'Document Name',
			description: 'Search by document name (uses a "contains" match).',
			required: true,
		}),
		folderId: folderIdProp,
		createIfNotFound: Property.Checkbox({
			displayName: 'Create a new document if not found?',
			defaultValue: false,
			required: false,
		}),
		newDocumentProps: Property.DynamicProperties({
			auth: googleDocsAuth,
			displayName: 'New Document Properties',
			required: false,
			refreshers: ['createIfNotFound'],
			props: async ({ auth, createIfNotFound }) => {
				if (!auth) return {};
				if (!createIfNotFound) return {};

				const props: DynamicPropsValue = {};
				props['content'] = Property.LongText({
					displayName: 'Document Content',
					description: 'Initial content for the new document.',
					required: true,
				});
				return props;
			},
		}),
	},
	async run(context) {
		const { name: documentName, folderId, createIfNotFound, newDocumentProps } = context.propsValue;
		const newDocumentContent = newDocumentProps?.['content'] as string | undefined;

		const authClient = await createGoogleClient(context.auth);
		const drive = google.drive({ version: 'v3', auth: authClient });
		const docs = google.docs({ version: 'v1', auth: authClient });

		const sanitizedName = documentName.replace(/'/g, "\\'");
		const query: string[] = [
			`name contains '${sanitizedName}'`,
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
			return { found: true, ...flattenDriveFile(existingFile) };
		}

		if (!createIfNotFound) {
			return { found: false, id: null, name: null, url: null };
		}

		const createdDoc = await docs.documents.create({ requestBody: { title: documentName } });
		const documentId = createdDoc.data.documentId;
		if (!documentId) throw new Error('Failed to create document.');

		if (newDocumentContent) {
			await docs.documents.batchUpdate({
				documentId,
				requestBody: {
					requests: [{ insertText: { text: newDocumentContent, endOfSegmentLocation: {} } }],
				},
			});
		}

		if (folderId) {
			await moveFileToFolder({ drive, fileId: documentId, folderId });
		}

		const finalFile = await drive.files.get({
			fileId: documentId,
			supportsAllDrives: true,
			fields: '*',
		});

		return { found: false, created: true, ...flattenDriveFile(finalFile.data) };
	},
});
