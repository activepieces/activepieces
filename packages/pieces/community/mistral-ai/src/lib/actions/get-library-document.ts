import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { libraryUtils, MistralDocument } from '../common/libraries';
import { documentOutputSchema } from '../output-schemas';

export const getLibraryDocument = createAction({
	auth: mistralAuth,
	name: 'get_library_document',
	classification: 'READ',
	displayName: 'Get Library Document',
	description: 'Get the details of a document in a library (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns one library document’s metadata (Beta): name, type, size, page count, summary, attributes and processing status. Use Get Document Text Content for the text itself. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: documentOutputSchema,
	props: {
		library_id: libraryUtils.libraryIdProp(),
		document_id: libraryUtils.documentIdProp(),
	},
	async run(context) {
		const { library_id, document_id } = context.propsValue;
		const document = await mistralApi.call<MistralDocument>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: libraryUtils.documentPath({ libraryId: library_id, documentId: document_id }),
		});
		return libraryUtils.formatDocument(document);
	},
});
