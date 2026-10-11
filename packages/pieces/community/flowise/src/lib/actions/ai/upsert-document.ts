import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseUpsertDocumentOutputSchema } from '../../output-schemas';

export const upsertDocumentAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_upsert_document',
	outputSchema: flowiseUpsertDocumentOutputSchema,
	displayName: 'Upsert Document',
	description: 'Loads, splits and upserts a document into a document store.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Loads a document into a document store and upserts its chunks into the vector store. Pass a Loader ID to re-run an existing loader (optionally with new config), or a loader config to add one. The store needs an embedding and vector store config, either already saved on it or passed here.',
		idempotent: false,
	},
	props: {
		storeId: flowiseAiProps.storeId({ required: true }),
		docId: flowiseAiProps.loaderId({
			required: false,
			displayName: 'Loader ID',
			description:
				'ID of an existing loader in the store to re-run. Leave empty to add a new loader from Loader.',
		}),
		replaceExisting: flowiseAiProps.yesNo({
			required: false,
			displayName: 'Replace Existing',
			description: 'Replace the existing loader config and chunks instead of merging.',
		}),
		metadata: Property.Json({
			displayName: 'Metadata',
			description: 'Metadata added to every chunk.',
			required: false,
		}),
		loader: Property.Json({
			displayName: 'Loader',
			description: 'Loader config, e.g. `{"name":"plainText","config":{"text":"..."}}`.',
			required: false,
		}),
		splitter: Property.Json({
			displayName: 'Splitter',
			description:
				'Text splitter config, e.g. `{"name":"recursiveCharacterTextSplitter","config":{"chunkSize":1000}}`.',
			required: false,
		}),
		embedding: Property.Json({
			displayName: 'Embedding',
			description:
				'Embedding model config, e.g. `{"name":"openAIEmbeddings","config":{"credential":"<credential id>"}}`.',
			required: false,
		}),
		vectorStore: Property.Json({
			displayName: 'Vector Store',
			description: 'Vector store config, e.g. `{"name":"faiss","config":{}}`.',
			required: false,
		}),
		recordManager: Property.Json({
			displayName: 'Record Manager',
			description:
				'Record manager config. Needed for Delete Vector Store Data to remove these chunks later.',
			required: false,
		}),
	},
	async run(context) {
		const {
			storeId,
			docId,
			replaceExisting,
			metadata,
			loader,
			splitter,
			embedding,
			vectorStore,
			recordManager,
		} = context.propsValue;
		return await flowiseApi.upsertDocument({
			auth: context.auth,
			storeId,
			fields: {
				docId,
				replaceExisting,
				metadata,
				loader,
				splitter,
				embedding,
				vectorStore,
				recordManager,
			},
		});
	},
});
