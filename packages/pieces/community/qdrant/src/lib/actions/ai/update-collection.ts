import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantSuccessOutputSchema } from '../../output-schemas';

export const updateCollectionAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_update_collection',
	outputSchema: qdrantSuccessOutputSchema,
	displayName: 'Update Collection',
	description: 'Updates the parameters of a collection.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Change parameters of an existing collection: optimizer, HNSW, quantization, replication or per-vector settings. Only the keys you send change, and vector sizes and distances can't be changed. Repeating the same update is safe.",
		idempotent: true,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		settings: Property.Json({
			displayName: 'Settings',
			description:
				'Parameters to change, e.g. {"optimizers_config": {"indexing_threshold": 10000}}, {"params": {"replication_factor": 2}}, {"hnsw_config": {"m": 32}} or {"vectors": {"text": {"on_disk": true}}}.',
			required: true,
		}),
	},
	run: async ({ auth, propsValue }) => {
		const updated = await qdrantApi.updateCollection({
			auth,
			collectionName: propsValue.collectionName,
			body: propsValue.settings,
		});
		return { success: updated };
	},
});
