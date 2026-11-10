import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeFetchVectorsOutputSchema } from '../../output-schemas';

export const pineconeFetchVectorsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_fetch_vectors',
	outputSchema: pineconeFetchVectorsOutputSchema,
	displayName: 'Fetch Vectors',
	description: 'Gets vector records by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets vector records by exact ID from a namespace, with their values and metadata. IDs that do not exist are simply missing from the result. For similarity search use Query Vectors.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		namespace: pineconeAiProps.namespace({ required: false }),
		ids: Property.Array({
			displayName: 'Vector IDs',
			description:
				'IDs of the records to get, e.g. ["vec-1", "vec-2"], from List Vector IDs or Query Vectors.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const index = client.index({
			name: p.indexName,
			...(p.namespace !== undefined ? { namespace: p.namespace } : {}),
		});
		return await index.fetch({
			ids: pineconeUtils.toStringList({ value: p.ids, propName: 'Vector IDs' }),
		});
	},
});
