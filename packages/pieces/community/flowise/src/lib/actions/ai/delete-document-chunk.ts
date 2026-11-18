import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseDocumentChunksOutputSchema } from '../../output-schemas';

export const deleteDocumentChunkAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_delete_document_chunk',
	outputSchema: flowiseDocumentChunksOutputSchema,
	displayName: 'Delete Document Chunk',
	description: 'Permanently deletes one chunk from a document loader.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one chunk (from Get Document Chunks) from a document loader. This cannot be undone.',
		idempotent: false,
	},
	props: {
		storeId: flowiseAiProps.storeId({ required: true }),
		loaderId: flowiseAiProps.loaderId({ required: true }),
		chunkId: Property.ShortText({
			displayName: 'Chunk ID',
			description: 'ID of the chunk, from Get Document Chunks.',
			required: true,
		}),
	},
	async run(context) {
		const { storeId, loaderId, chunkId } = context.propsValue;
		return await flowiseApi.deleteDocumentChunk({ auth: context.auth, storeId, loaderId, chunkId });
	},
});
