import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { libraryUtils } from '../common/libraries';
import { documentStatusOutputSchema } from '../output-schemas';

export const getDocumentStatus = createAction({
	auth: mistralAuth,
	name: 'get_document_status',
	classification: 'READ',
	displayName: 'Get Document Status',
	description: 'Check whether a library document has finished processing (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the processing status of one library document (Beta), e.g. todo, in_progress, done or error, with an is_done flag. Poll it after Upload Library Document or Reprocess Document; one call is a single check, not a wait. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: documentStatusOutputSchema,
	props: {
		library_id: libraryUtils.libraryIdProp(),
		document_id: libraryUtils.documentIdProp(),
	},
	async run(context) {
		const { library_id, document_id } = context.propsValue;
		const status = await mistralApi.call<{ document_id: string; process_status: string }>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `${libraryUtils.documentPath({ libraryId: library_id, documentId: document_id })}/status`,
		});
		return {
			document_id: status.document_id,
			process_status: status.process_status,
			is_done: status.process_status === 'done',
			is_error: status.process_status === 'error',
		};
	},
});
