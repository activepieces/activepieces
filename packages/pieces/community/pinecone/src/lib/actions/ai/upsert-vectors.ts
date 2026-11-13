import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeUpsertTextRecordsOutputSchema } from '../../output-schemas';

export const pineconeUpsertVectorsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_upsert_vectors',
	outputSchema: pineconeUpsertTextRecordsOutputSchema,
	displayName: 'Upsert Vectors',
	description: 'Inserts or overwrites vector records in a namespace.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Writes up to 1000 vector records into a namespace of a vectors index; a record with an existing ID is overwritten. Each record is {"id", "values" (dense), "sparseValues" ({"indices", "values"}), "metadata"}; values must match the index dimension. Does not work on documents indexes.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		namespace: pineconeAiProps.namespace({ required: false }),
		vectors: Property.Array({
			displayName: 'Vectors',
			description:
				'Records to write, e.g. [{"id": "vec-1", "values": [0.1, 0.2, 0.3], "metadata": {"genre": "drama", "year": 2020}}]. Metadata values are strings, numbers, booleans or lists of strings.',
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
		const records = pineconeUtils.toVectorRecords({ value: p.vectors, propName: 'Vectors' });
		if (records.length === 0 || records.length > 1000) {
			throw new Error('"Vectors" must hold 1 to 1000 records.');
		}
		await index.upsert({ records });
		return { upsertedCount: records.length, ids: records.map((record) => record.id) };
	},
});
