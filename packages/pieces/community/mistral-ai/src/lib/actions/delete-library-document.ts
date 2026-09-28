import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { libraryUtils } from '../common/libraries';
import { deleteLibraryDocumentOutputSchema } from '../output-schemas';

export const deleteLibraryDocument = createAction({
	auth: mistralAuth,
	name: 'delete_library_document',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Library Document',
	description: 'Permanently remove a document from a library (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently removes one document from a library (Beta) by library and document UUID; agents using the library stop finding it. Use Delete Library to remove the whole library. Not idempotent: a repeat call fails because the document is gone.',
		idempotent: false,
	},
	outputSchema: deleteLibraryDocumentOutputSchema,
	props: {
		library_id: libraryUtils.libraryIdProp(),
		document_id: libraryUtils.documentIdProp(),
	},
	async run(context) {
		const { library_id, document_id } = context.propsValue;
		await mistralApi.call<unknown>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: libraryUtils.documentPath({ libraryId: library_id, documentId: document_id }),
		});
		return { library_id, document_id, deleted: true };
	},
});
