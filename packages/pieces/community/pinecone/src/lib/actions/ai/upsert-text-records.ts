import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeUpsertTextRecordsOutputSchema } from '../../output-schemas';

export const pineconeUpsertTextRecordsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_upsert_text_records',
	outputSchema: pineconeUpsertTextRecordsOutputSchema,
	displayName: 'Upsert Text Records',
	description: "Writes text records that Pinecone embeds with the index's hosted model.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Writes up to 96 records into a namespace of an index made by Create Index for Embedding Model; Pinecone embeds the index\'s text field for you. Each record is {"_id": "...", <text field>: "...", <other metadata fields>}; a record with an existing ID is overwritten.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		namespace: pineconeAiProps.namespace({ required: false }),
		records: Property.Array({
			displayName: 'Records',
			description:
				'Records to write, e.g. [{"_id": "rec-1", "chunk_text": "Apples are rich in fiber.", "category": "nutrition"}]. The text field name is the one given when the index was created.',
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
		const records = pineconeUtils.toTextRecords({ value: p.records, propName: 'Records' });
		await index.upsertRecords({ records });
		return { upsertedCount: records.length, ids: records.map((record) => record._id) };
	},
});
