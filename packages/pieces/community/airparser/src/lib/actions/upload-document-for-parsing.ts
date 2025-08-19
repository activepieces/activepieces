import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { airparserAuth } from '../../index';
import { BASE_URL } from '../common';
import { inboxIdDropdown } from '../common/props';

export const uploadDocumentAction = createAction({
	auth: airparserAuth,
	name: 'upload_document',
	displayName: 'Upload Document',
	description: 'Upload a document to an Airparser inbox for parsing.',
	props: {
		inboxId: inboxIdDropdown,
		file: Property.File({
			displayName: 'File',
			description: 'The document file to upload for parsing.',
			required: true,
		}),
		fileName: Property.ShortText({
			displayName: 'File Name',
			required: false,
		}),
		meta: Property.Object({
			displayName: 'Metadata',
			description: 'Optional metadata to associate with the document.',
			required: false,
		}),
	},
	async run(context) {
		const { inboxId, file, meta, fileName } = context.propsValue;

		const formData = new FormData();
		formData.append('file', Buffer.from(file.base64, 'base64'), fileName || file.filename);

		if (meta) {
			formData.append('meta', JSON.stringify(meta));
		}

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: BASE_URL + `/inboxes/${inboxId}/upload`,
			headers: {
				...formData.getHeaders(),
				'X-API-Key': context.auth,
			},
			body: formData,
		});

		return { docId: response.body };
	},
});
