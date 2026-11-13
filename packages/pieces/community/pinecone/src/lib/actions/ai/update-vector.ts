import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeUpdateVectorOutputSchema } from '../../output-schemas';

export const pineconeUpdateVectorAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_update_vector',
	outputSchema: pineconeUpdateVectorOutputSchema,
	displayName: 'Update Vector',
	description:
		'Updates the values or metadata of one record, or the metadata of all records matching a filter.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates one record by ID, or every record matching a metadata filter (set exactly one of Vector ID or Filter). Only what you set changes: new dense values, new sparse values, and metadata keys to set (other metadata keys are kept). A filter update can only set metadata.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		namespace: pineconeAiProps.namespace({ required: false }),
		id: Property.ShortText({
			displayName: 'Vector ID',
			description: 'ID of the record to update, from List Vector IDs or Query Vectors.',
			required: false,
		}),
		filter: Property.Json({
			displayName: 'Filter',
			description:
				'Update every record matching this metadata filter instead of one ID, e.g. {"genre": {"$eq": "drama"}}.',
			required: false,
		}),
		values: Property.Array({
			displayName: 'Values',
			description: 'New dense values, e.g. [0.1, 0.2, 0.3]. Must match the index dimension.',
			required: false,
		}),
		sparseIndices: Property.Array({
			displayName: 'Sparse Indices',
			description: 'Sparse vector positions, e.g. [10, 45]. Same length as Sparse Values.',
			required: false,
		}),
		sparseValues: Property.Array({
			displayName: 'Sparse Values',
			description: 'Sparse vector values, e.g. [0.5, 0.3]. Same length as Sparse Indices.',
			required: false,
		}),
		setMetadata: Property.Json({
			displayName: 'Set Metadata',
			description:
				'Metadata keys to set or overwrite, e.g. {"genre": "comedy"}. Keys not listed are kept.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		if ((p.id === undefined) === (p.filter === undefined)) {
			throw new Error('Set exactly one of "Vector ID" or "Filter".');
		}
		if ((p.sparseIndices === undefined) !== (p.sparseValues === undefined)) {
			throw new Error('Set "Sparse Indices" and "Sparse Values" together.');
		}
		const index = client.index({
			name: p.indexName,
			...(p.namespace !== undefined ? { namespace: p.namespace } : {}),
		});
		await index.update({
			...(p.id !== undefined ? { id: p.id } : {}),
			...(p.filter !== undefined ? { filter: p.filter } : {}),
			...(p.values !== undefined
				? { values: pineconeUtils.toNumberList({ value: p.values, propName: 'Values' }) }
				: {}),
			...(p.sparseIndices !== undefined && p.sparseValues !== undefined
				? {
						sparseValues: pineconeUtils.toSparseValues({
							indices: p.sparseIndices,
							values: p.sparseValues,
							propName: 'Sparse',
						}),
				  }
				: {}),
			...(p.setMetadata !== undefined
				? {
						metadata: pineconeUtils.toRecordMetadata({
							value: p.setMetadata,
							propName: 'Set Metadata',
						}),
				  }
				: {}),
		});
		return { updated: true, ...(p.id !== undefined ? { id: p.id } : { filter: p.filter }) };
	},
});
