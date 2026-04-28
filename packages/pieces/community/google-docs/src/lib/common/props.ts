/* eslint-disable @typescript-eslint/no-explicit-any */
import { googleDocsAuth, createGoogleClient, GoogleDocsAuthValue } from '../auth';
import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { google, drive_v3 } from 'googleapis';

export const folderIdProp = (displayName: string, description: string, required = false) =>
	Property.Dropdown({
		displayName,
		description,
		refreshers: [],
		auth: googleDocsAuth,
		required,
		options: async ({ auth }, { searchValue }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please connect your Google account.',
					options: [],
				};
			}
			const authValue = auth as GoogleDocsAuthValue;
			const authClient = await createGoogleClient(authValue);
			const drive = google.drive({ version: 'v3', auth: authClient });

			const q = ["mimeType='application/vnd.google-apps.folder'", 'trashed = false'];
			if (searchValue) {
				q.push(`name contains '${searchValue.replace(/'/g, "\\'")}'`);
			}

			const options: DropdownOption<string>[] = [];
			let nextPageToken: string | undefined;

			do {
				const response: any = await drive.files.list({
					q: q.join(' and '),
					supportsAllDrives: true,
					orderBy: 'createdTime desc',
					fields: 'nextPageToken, files(id, name)',
					includeItemsFromAllDrives: true,
					pageToken: nextPageToken,
				});

				const fileList: drive_v3.Schema$FileList = response.data;
				if (fileList.files) {
					for (const file of fileList.files) {
						options.push({ label: file.name!, value: file.id! });
					}
				}
				nextPageToken = response.data.nextPageToken;
			} while (nextPageToken);

			return { disabled: false, options };
		},
	});

export const documentImageIdProp = (displayName: string, description: string, required = true) =>
	Property.Dropdown({
		displayName,
		description,
		auth: googleDocsAuth,
		required,
		refreshers: ['documentId'],
		options: async ({ auth, documentId }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please connect your Google account.',
					options: [],
				};
			}
			if (!documentId) {
				return {
					disabled: true,
					placeholder: 'Select a document first.',
					options: [],
				};
			}

			const authValue = auth as GoogleDocsAuthValue;
			const authClient = await createGoogleClient(authValue);
			const docs = google.docs({ version: 'v1', auth: authClient });

			const response = await docs.documents.get({ documentId: documentId as string });
			const inlineObjects = response.data.inlineObjects ?? {};
			const options: DropdownOption<string>[] = [];
			let index = 1;

			for (const [objectId, obj] of Object.entries(inlineObjects)) {
				const embedded = obj.inlineObjectProperties?.embeddedObject;
				const title = embedded?.title?.trim();
				const description = embedded?.description?.trim();
				const width = embedded?.size?.width?.magnitude;
				const height = embedded?.size?.height?.magnitude;
				const dims = width && height ? ` — ${Math.round(width)}×${Math.round(height)}` : '';
				const prefix = title || description || `Image ${index}`;
				options.push({
					label: `${prefix}${dims}`,
					value: objectId,
				});
				index += 1;
			}

			if (options.length === 0) {
				return {
					disabled: true,
					placeholder: 'No images found in this document.',
					options: [],
				};
			}

			return { disabled: false, options };
		},
	});

export const documentIdProp = (displayName: string, description: string, required = true) =>
	Property.Dropdown({
		displayName,
		description,
		auth: googleDocsAuth,
		required,
		refreshers: [],
		options: async ({ auth }, { searchValue }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please connect your Google account.',
					options: [],
				};
			}
			const authValue = auth as GoogleDocsAuthValue;
			const authClient = await createGoogleClient(authValue);
			const drive = google.drive({ version: 'v3', auth: authClient });

			const q = ["mimeType='application/vnd.google-apps.document'", 'trashed = false'];
			if (searchValue) {
				q.push(`name contains '${searchValue.replace(/'/g, "\\'")}'`);
			}

			const options: DropdownOption<string>[] = [];
			let nextPageToken: string | undefined;

			do {
				const response: any = await drive.files.list({
					q: q.join(' and '),
					supportsAllDrives: true,
					orderBy: 'modifiedTime desc',
					fields: 'nextPageToken, files(id, name)',
					includeItemsFromAllDrives: true,
					pageToken: nextPageToken,
				});

				const fileList: drive_v3.Schema$FileList = response.data;
				if (fileList.files) {
					for (const file of fileList.files) {
						options.push({ label: file.name!, value: file.id! });
					}
				}
				nextPageToken = response.data.nextPageToken;
			} while (nextPageToken);

			return { disabled: false, options };
		},
	});
