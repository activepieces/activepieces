import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeGetIndexStatsOutputSchema } from '../../output-schemas';

export const pineconeGetIndexStatsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_get_index_stats',
	outputSchema: pineconeGetIndexStatsOutputSchema,
	displayName: 'Get Index Stats',
	description: 'Gets record counts per namespace and fullness for an index.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets statistics for a vector index: total record count, record count per namespace, dimension, metric and fullness. Optionally counts only records matching a metadata filter, on pod-based indexes only: serverless indexes reject a filter.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		filter: Property.Json({
			displayName: 'Metadata Filter',
			description:
				'Pod-based indexes only: count only records whose metadata matches this filter, e.g. {"genre": {"$eq": "drama"}}. Serverless indexes reject it.',
			required: false,
		}),
	},
	async run(context) {
		const { indexName, filter } = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const index = client.index({ name: indexName });
		return await index.describeIndexStats(filter ? { filter } : undefined);
	},
});
