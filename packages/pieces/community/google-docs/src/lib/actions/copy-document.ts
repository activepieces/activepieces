import { Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { googleDocsAuth, createGoogleClient } from '../auth';
import { flattenDriveFile, moveFileToFolder } from '../common';
import { documentIdProp, folderIdProp } from '../common/props';

export const copyDocument = createAction({
	auth: googleDocsAuth,
	name: 'copy_document',
	displayName: 'Copy Document',
	description: 'Duplicate an existing Google Doc and optionally move the copy to a folder.',
	props: {
		documentId: documentIdProp('Document to Copy', 'The Google Doc to duplicate.'),
		newTitle: Property.ShortText({
			displayName: 'New Document Title',
			description: 'Title of the copy. Leave empty to keep the default "Copy of …" title.',
			required: false,
		}),
		folderId: folderIdProp(
			'Destination Folder',
			'Move the copy into this folder. Leave empty to keep it next to the original.',
		),
	},
	async run(context) {
		const { documentId, newTitle, folderId } = context.propsValue;

		const authClient = await createGoogleClient(context.auth);
		const drive = google.drive({ version: 'v3', auth: authClient });

		const copied = await drive.files.copy({
			fileId: documentId,
			supportsAllDrives: true,
			fields: '*',
			requestBody: {
				name: newTitle || undefined,
			},
		});

		const copiedId = copied.data.id;
		if (!copiedId) {
			throw new Error('Failed to copy document: no file ID returned.');
		}

		if (folderId) {
			await moveFileToFolder({ drive, fileId: copiedId, folderId });
			const refreshed = await drive.files.get({
				fileId: copiedId,
				supportsAllDrives: true,
				fields: '*',
			});
			return flattenDriveFile(refreshed.data);
		}

		return flattenDriveFile(copied.data);
	},
});
