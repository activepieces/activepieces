import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { doctlyAuth } from '../../auth';
import { doctlyClient } from '../../common/client';
import { doctlyAiProps } from '../../common/ai-props';
import { doctlyDeleteDocumentOutputSchema } from '../../output-schemas';

export const deleteDocumentAction = createAction({
	auth: doctlyAuth,
	name: 'doctly_delete_document',
	outputSchema: doctlyDeleteDocumentOutputSchema,
	displayName: 'Delete Document',
	description: 'Permanently deletes a document and its files.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes one document and its uploaded and output files; this cannot be undone. Get the id from List Documents.',
		idempotent: false,
	},
	props: {
		documentId: doctlyAiProps.documentId({ required: true }),
	},
	async run(context) {
		return await doctlyClient.request({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/documents/${encodeURIComponent(context.propsValue.documentId)}`,
		});
	},
});
