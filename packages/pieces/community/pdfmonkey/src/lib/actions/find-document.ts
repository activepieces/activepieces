import { createAction } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { documentIdDropdown } from '../common/props';

export const findDocumentAction = createAction({
	auth: pdfmonkeyAuth,
	name: 'findDocument',
	displayName: 'Find Document',
	description: 'Finds a document by ID.',
	audience: 'both',
	aiMetadata: { description: 'Look up a single PDFMonkey document by its document ID, returning its current state including generation status and download URL. Use to check whether a document finished generating or to retrieve its download link. Read-only and idempotent.', idempotent: true },
	props: {
		document_id: documentIdDropdown,
	},
	async run({ auth, propsValue }) {
		const { document_id } = propsValue;
		return await makeRequest(auth, HttpMethod.GET, `/documents/${document_id}`);
	},
});
