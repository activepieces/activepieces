import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeDeleteDocumentsOutputSchema } from '../../output-schemas';

export const pineconeDeleteDocumentsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_delete_documents',
	outputSchema: pineconeDeleteDocumentsOutputSchema,
	displayName: 'Delete Documents',
	description: 'Deletes documents by ID, by filter, or all documents in a namespace.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes documents from a namespace: the listed IDs, every document matching a metadata filter, or every document in the namespace. Set exactly one of Document IDs, Filter or Delete All. Cannot be undone. Works only on documents indexes (created by Create Index with Full-Text Fields).',
		idempotent: false,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		namespace: pineconeAiProps.namespace({ required: false }),
		ids: Property.Array({
			displayName: 'Document IDs',
			description: 'IDs of the documents to delete, e.g. ["doc-1"].',
			required: false,
		}),
		filter: Property.Json({
			displayName: 'Filter',
			description: 'Delete every document matching this metadata filter.',
			required: false,
		}),
		deleteAll: Property.Checkbox({
			displayName: 'Delete All',
			description: 'Delete every document in the namespace.',
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
			throw new Error('Set exactly one of "Document IDs", "Filter" or "Delete All".');
		}
		const documents = client.index({
			name: p.indexName,
			...(p.namespace !== undefined ? { namespace: p.namespace } : {}),
		}).documents;
		if (p.deleteAll === true) {
			const response = await documents.delete({ deleteAll: true });
			return { deleted: true, ...response, mode: 'all', namespace: p.namespace ?? '__default__' };
		}
		if (p.filter !== undefined) {
			const response = await documents.delete({ filter: p.filter });
			return { deleted: true, ...response, mode: 'filter', filter: p.filter };
		}
		const ids = pineconeUtils.toStringList({ value: p.ids ?? [], propName: 'Document IDs' });
		const response = await documents.delete({ ids });
		return { deleted: true, ...response, mode: 'ids', ids };
	},
});
