import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { airparserAuth } from '../auth';
import { airparserClient, airparserOutputSchemas, pathFor, requireId, toDocument } from '../common';
import { documentIdDropdown, inboxIdDropdown } from '../common/props';

export const extractDataFromDocumentAction = createAction({
	auth: airparserAuth,
	name: 'extract_data_from_document',
	classification: 'READ',
	displayName: 'Get Data from Document',
	description: 'Get the parsed data and details of one document.',
	audience: 'human',
	aiMetadata: { idempotent: true },
	outputSchema: airparserOutputSchemas.document,
	props: {
		inboxId: inboxIdDropdown,
		documentId: documentIdDropdown,
	},
	async run(context) {
		const response = await airparserClient.call({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/docs${pathFor([requireId({ value: context.propsValue.documentId, label: 'Document' })])}/extended`,
			operation: 'get document',
		});
		return toDocument(response);
	},
});
