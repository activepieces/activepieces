import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseDocumentChunksOutputSchema } from '../../output-schemas';

export const getDocumentChunksAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_get_document_chunks',
	outputSchema: flowiseDocumentChunksOutputSchema,
	displayName: 'Get Document Chunks',
	description: 'Gets one page of the chunks of a document loader.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Gets one page of the text chunks a document loader produced, with the total `count` and `currentPage`. Returns each chunk `id` for Update and Delete Document Chunk.',
		idempotent: true,
	},
	props: {
		storeId: flowiseAiProps.storeId({ required: true }),
		loaderId: flowiseAiProps.loaderId({ required: true }),
		pageNo: Property.Number({
			displayName: 'Page',
			description: 'Page number, starting at 1. Defaults to 1.',
			required: false,
		}),
	},
	async run(context) {
		const { storeId, loaderId, pageNo } = context.propsValue;
		return await flowiseApi.getDocumentChunks({
			auth: context.auth,
			storeId,
			loaderId,
			pageNo: pageNo ?? 1,
		});
	},
});
