import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { airparserAuth } from '../../index';
import { airparserApiCall, GetDocumentResponse } from '../common';
import { documentIdDropdown, inboxIdDropdown } from '../common/props';

export const extractDataFromDocumentAction = createAction({
	auth: airparserAuth,
	name: 'extract_data_from_document',
	displayName: 'Get Data from Document',
	description: 'Retrieves parsed JSON data from a specific document.',
	props: {
		inboxId: inboxIdDropdown,
		documentId: documentIdDropdown,
	},
	async run(context) {
		const { documentId } = context.propsValue;

		const response = await airparserApiCall<GetDocumentResponse>({
			apiKey: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/docs/${documentId}/extended`,
		});

		return {
			json: response.json,
			id: response._id,
			inbox_id: response.inbox_id,
			owner_id: response.owner_id,
			name: response.name,
			data_text: response.data_text,
			format: response.format,
			status: response.status,
			created_at: response.created_at,
			processed_at: response.processed_at,
			secret: response.secret,
			filename: response.filename,
			content_type: response.content_type,
			credits: response.credits,
		};
	},
});


