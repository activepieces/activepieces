import { createAction } from '@activepieces/pieces-framework';
import { doctlyAuth } from '../../auth';
import { doctlyApi } from '../../common/api';
import { doctlyClient } from '../../common/client';
import { doctlyAiProps } from '../../common/ai-props';
import { doctlyGetDocumentOutputSchema } from '../../output-schemas';

export const getDocumentAction = createAction({
	auth: doctlyAuth,
	name: 'doctly_get_document',
	outputSchema: doctlyGetDocumentOutputSchema,
	displayName: 'Get Document',
	description: 'Gets a document, its status and, once completed, its output.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one document by id: its status (QUEUED, PENDING, PROCESSING, COMPLETED, FAILED, EXPIRED) and, once COMPLETED, its output (markdown for a conversion, extracted data for an extractor run). Use it to poll a document started by Convert Document or Run Extractor; it checks once and never waits.',
		idempotent: true,
	},
	props: {
		documentId: doctlyAiProps.documentId({ required: true }),
	},
	async run(context) {
		const document = await doctlyApi.getDocument({ auth: context.auth, documentId: encodeURIComponent(context.propsValue.documentId) });
		if (document.status !== 'COMPLETED' || !document.output_file_url) {
			return { ...document, output: null };
		}
		const output = await doctlyClient.download<unknown>({ url: document.output_file_url });
		return { ...document, output };
	},
});
