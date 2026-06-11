import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { airparserAuth } from '../auth';
import { airparserApiCall, GetDocumentResponse } from '../common';
import { documentIdDropdown, inboxIdDropdown } from '../common/props';

export const extractDataFromDocumentAction = createAction({
	auth: airparserAuth,
	name: 'extract_data_from_document',
	displayName: 'Get Data from Document',
	description: 'Retrieves parsed JSON data from a specific document.',
	audience: 'both',
	aiMetadata: { description: 'Fetches the parsed/extracted structured data and metadata for one already-processed Airparser document, identified by its inbox and document ID. Use after a document has finished parsing to read back the extracted fields. Read-only and idempotent; repeating the call returns the same result.', idempotent: true },
	props: {
		inboxId: inboxIdDropdown,
		documentId: documentIdDropdown,
	},
	async run(context) {
		const { documentId } = context.propsValue;

		const response = await airparserApiCall<GetDocumentResponse>({
			apiKey: context.auth.secret_text,
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


