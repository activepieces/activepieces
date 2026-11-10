import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeDeleteVectorsOutputSchema } from '../../output-schemas';

export const pineconeDeleteVectorsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_delete_vectors',
	outputSchema: pineconeDeleteVectorsOutputSchema,
	displayName: 'Delete Vectors',
	description: 'Deletes records by ID, by metadata filter, or all records in a namespace.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes records from a namespace: the listed IDs, every record matching a metadata filter, or every record in the namespace. Set exactly one of Vector IDs, Filter or Delete All. Cannot be undone.',
		idempotent: false,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		namespace: pineconeAiProps.namespace({ required: false }),
		ids: Property.Array({
			displayName: 'Vector IDs',
			description: 'IDs of the records to delete, e.g. ["vec-1", "vec-2"], up to 1000.',
			required: false,
		}),
		filter: Property.Json({
			displayName: 'Filter',
			description:
				'Delete every record matching this metadata filter, e.g. {"genre": {"$eq": "drama"}}.',
			required: false,
		}),
		deleteAll: Property.Checkbox({
			displayName: 'Delete All',
			description: 'Delete every record in the namespace.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const modes = [p.ids !== undefined, p.filter !== undefined, p.deleteAll === true].filter(
			Boolean,
		).length;
		if (modes !== 1) {
			throw new Error('Set exactly one of "Vector IDs", "Filter" or "Delete All".');
		}
		const index = client.index({
			name: p.indexName,
			...(p.namespace !== undefined ? { namespace: p.namespace } : {}),
		});
		if (p.deleteAll === true) {
			await index.deleteAll();
			return { deleted: true, mode: 'all', namespace: p.namespace ?? '__default__' };
		}
		if (p.filter !== undefined) {
			await index.deleteMany({ filter: p.filter });
			return { deleted: true, mode: 'filter', filter: p.filter };
		}
		const ids = pineconeUtils.toStringList({ value: p.ids ?? [], propName: 'Vector IDs' });
		await index.deleteMany({ ids });
		return { deleted: true, mode: 'ids', ids };
	},
});
