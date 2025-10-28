import { createAction, Property } from '@activepieces/pieces-framework';
import { NinoxAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
	teamidDropdown,
	databaseIdDropdown,
	tableIdDropdown,
	recordIdDropdown,
} from '../common/props';
import mime from 'mime-types';

export const uploadFile = createAction({
	auth: NinoxAuth,
	name: 'uploadFile',
	displayName: 'Upload File',
	description: 'Attach a file to a record.',
	props: {
		teamid: teamidDropdown,
		dbid: databaseIdDropdown,
		tid: tableIdDropdown,
		rid: recordIdDropdown,
		file: Property.File({
			displayName: 'File',
			description: 'The file to upload to the record.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const { teamid, dbid, tid, rid, file } = propsValue;

		const path = `/teams/${teamid}/databases/${dbid}/tables/${tid}/records/${rid}/files`;

		try {
			// Determine MIME type from file extension
			const mimeType = file.extension
				? mime.lookup(file.extension) || 'application/octet-stream'
				: 'application/octet-stream';

			// Create FormData for multipart/form-data upload
			const formData = new FormData();
			const blob = new Blob([file.data], { type: mimeType });
			formData.append('file', blob, file.filename);

			const response = await makeRequest(
				auth,
				HttpMethod.POST,
				path,
				formData,
				'multipart/form-data',
			);
			return {
				success: true,
				response: response,
			};
		} catch (error) {
			throw new Error(`Failed to upload file: ${error}`);
		}
	},
});
