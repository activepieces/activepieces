import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { libraryUtils } from '../common/libraries';
import { documentTextContentOutputSchema } from '../output-schemas';

export const getDocumentTextContent = createAction({
	auth: mistralAuth,
	name: 'get_document_text_content',
	classification: 'READ',
	displayName: 'Get Document Text Content',
	description: 'Get the text Mistral extracted from a library document (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the text Mistral extracted from a processed library document (Beta), optionally limited to a page range. The document must have finished processing; check Get Document Status first. Use OCR instead for files that are not in a library. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: documentTextContentOutputSchema,
	props: {
		library_id: libraryUtils.libraryIdProp(),
		document_id: libraryUtils.documentIdProp(),
		page_start: Property.Number({ displayName: 'First Page', required: false }),
		page_end: Property.Number({ displayName: 'Last Page', required: false }),
	},
	async run(context) {
		const { library_id, document_id, page_start, page_end } = context.propsValue;
		const response = await mistralApi.call<{ text: string }>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `${libraryUtils.documentPath({ libraryId: library_id, documentId: document_id })}/text_content`,
			queryParams: { page_start, page_end },
		});
		return { document_id, text: response.text, length: response.text.length };
	},
});
