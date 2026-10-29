import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseDocumentChunksOutputSchema } from '../../output-schemas';

export const updateDocumentChunkAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_update_document_chunk',
	outputSchema: flowiseDocumentChunksOutputSchema,
	displayName: 'Update Document Chunk',
	description: 'Replaces the text and metadata of one chunk.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replaces the text (and optionally the metadata) of one chunk of a document loader. Chunk IDs come from Get Document Chunks. Run Refresh Document Store or Upsert Document afterwards to update the vector store.',
		idempotent: true,
	},
	props: {
		storeId: flowiseAiProps.storeId({ required: true }),
		loaderId: flowiseAiProps.loaderId({ required: true }),
		chunkId: Property.ShortText({
			displayName: 'Chunk ID',
			description: 'ID of the chunk, from Get Document Chunks.',
			required: true,
		}),
		pageContent: Property.LongText({
			displayName: 'Content',
			description: 'New text of the chunk.',
			required: true,
		}),
		metadata: Property.Json({
			displayName: 'Metadata',
			description: 'New metadata object of the chunk.',
			required: false,
		}),
	},
	async run(context) {
		const { storeId, loaderId, chunkId, pageContent, metadata } = context.propsValue;
		return await flowiseApi.updateDocumentChunk({
			auth: context.auth,
			storeId,
			loaderId,
			chunkId,
			pageContent,
			metadata,
		});
	},
});
