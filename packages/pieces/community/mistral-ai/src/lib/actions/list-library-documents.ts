import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { libraryUtils, MistralDocument } from '../common/libraries';
import { listLibraryDocumentsOutputSchema } from '../output-schemas';

export const listLibraryDocuments = createAction({
	auth: mistralAuth,
	name: 'list_library_documents',
	classification: 'SEARCH',
	displayName: 'List Library Documents',
	description: 'List the documents in a library (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the documents in one library (Beta) with their UUIDs, names, sizes, summaries and processing status, optionally filtered by a name search, one page at a time. Use it to find a document id for the other document actions. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: listLibraryDocumentsOutputSchema,
	props: {
		library_id: libraryUtils.libraryIdProp(),
		search: Property.ShortText({
			displayName: 'Search',
			description: 'Only return documents whose name contains this text.',
			required: false,
		}),
		page: Property.Number({ displayName: 'Page', description: 'Zero-based page number.', required: false, defaultValue: 0 }),
		page_size: Property.Number({ displayName: 'Page Size', required: false, defaultValue: 100 }),
	},
	async run(context) {
		const { library_id, search, page, page_size } = context.propsValue;
		const response = await mistralApi.call<{ data: MistralDocument[]; pagination?: { total_items?: number; has_more?: boolean } }>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/libraries/${encodeURIComponent(library_id)}/documents`,
			queryParams: { search, page, page_size },
		});
		const documents = response.data.map(libraryUtils.formatDocument);
		return {
			documents,
			count: documents.length,
			total: response.pagination?.total_items ?? null,
			has_more: response.pagination?.has_more ?? null,
		};
	},
});
