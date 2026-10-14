import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { libraryUtils } from '../common/libraries';
import { reprocessDocumentOutputSchema } from '../output-schemas';

export const reprocessDocument = createAction({
	auth: mistralAuth,
	name: 'reprocess_document',
	classification: 'WRITE',
	displayName: 'Reprocess Document',
	description: 'Run text extraction and indexing again for a library document (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Queues a library document (Beta) to be processed again, re-extracting and re-indexing its text, for example after a processing error. It returns once queued; poll Get Document Status for the result. Not idempotent: each call starts a new processing run.',
		idempotent: false,
	},
	outputSchema: reprocessDocumentOutputSchema,
	props: {
		library_id: libraryUtils.libraryIdProp(),
		document_id: libraryUtils.documentIdProp(),
	},
	async run(context) {
		const { library_id, document_id } = context.propsValue;
		await mistralApi.call<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `${libraryUtils.documentPath({ libraryId: library_id, documentId: document_id })}/reprocess`,
		});
		return { library_id, document_id, reprocessing: true };
	},
});
