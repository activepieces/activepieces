import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airparserAuth } from '../../auth';
import { airparserClient, airparserOutputSchemas, pathFor, requireId, toDocument } from '../../common';

export const getDocumentAiAction = createAction({
	auth: airparserAuth,
	name: 'get_document',
	classification: 'READ',
	displayName: 'Get Document',
	description: 'Get one document with its parsed data.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns one Airparser document by Document ID: status, file details, extracted text and the parsed JSON (json). If status is not parsed yet, json may be empty; call again later. Set Raw Parser Output to yes for the output before post-processing. Read-only.',
		idempotent: true,
	},
	outputSchema: airparserOutputSchemas.document,
	props: {
		documentId: Property.ShortText({ displayName: 'Document ID', description: 'The document ID, from List Documents or an upload.', required: true }),
		rawOutput: Property.StaticDropdown<string>({
			displayName: 'Raw Parser Output',
			description: 'yes returns the parser output before post-processing. Defaults to no.',
			required: false,
			options: { options: [{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }] },
		}),
	},
	async run(context) {
		const documentId = requireId({ value: context.propsValue.documentId, label: 'Document ID' });
		const response = await airparserClient.call({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/docs${pathFor([documentId])}/extended`,
			operation: 'get document',
			query: { source: context.propsValue.rawOutput === 'yes' ? 'parsed' : undefined },
		});
		return toDocument(response);
	},
});
