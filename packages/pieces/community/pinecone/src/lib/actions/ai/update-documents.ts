import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeUpdateDocumentsOutputSchema } from '../../output-schemas';

export const pineconeUpdateDocumentsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_update_documents',
	outputSchema: pineconeUpdateDocumentsOutputSchema,
	displayName: 'Update Documents',
	description: 'Patches fields of documents by ID or of every document matching a filter.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Patches documents without replacing them: either per-ID patches in Documents ([{"_id", <field>: <new value>, "_remove_fields": [...]}]), or Set Fields / Remove Fields applied to every document matching Filter. Set exactly one of Documents or Filter. Fields not mentioned are kept. Remove Fields with Filter removes metadata fields only; remove full-text or vector fields per document. Works only on documents indexes (created by Create Index with Full-Text Fields).',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		namespace: pineconeAiProps.namespace({ required: false }),
		documents: Property.Array({
			displayName: 'Documents',
			description:
				'Per-ID patches, e.g. [{"_id": "doc-1", "year": 2025, "_remove_fields": ["draft"]}].',
			required: false,
		}),
		filter: Property.Json({
			displayName: 'Filter',
			description: 'Patch every document matching this metadata filter, e.g. {"status": "draft"}.',
			required: false,
		}),
		setFields: Property.Json({
			displayName: 'Set Fields',
			description: 'With Filter: fields to set, e.g. {"status": "published"}.',
			required: false,
		}),
		removeFields: Property.Array({
			displayName: 'Remove Fields',
			description:
				'With Filter: metadata field names to remove, e.g. ["draft_notes"]. Full-text and vector fields can only be removed per document, with "_remove_fields" in Documents.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		if ((p.documents === undefined) === (p.filter === undefined)) {
			throw new Error('Set exactly one of "Documents" or "Filter".');
		}
		if (p.documents !== undefined && (p.setFields !== undefined || p.removeFields !== undefined)) {
			throw new Error('"Set Fields" and "Remove Fields" go with "Filter", not "Documents".');
		}
		const documents = client.index({
			name: p.indexName,
			...(p.namespace !== undefined ? { namespace: p.namespace } : {}),
		}).documents;
		if (p.documents !== undefined) {
			const patches = pineconeUtils.toDocuments({ value: p.documents, propName: 'Documents' });
			const response = await documents.update({ documents: patches });
			return { updated: true, ...response, ids: patches.map((patch) => patch._id) };
		}
		const response = await documents.update({
			filter: p.filter,
			...(p.setFields !== undefined
				? {
						setFields: pineconeUtils.toRecordMetadata({
							value: p.setFields,
							propName: 'Set Fields',
						}),
				  }
				: {}),
			...(p.removeFields !== undefined
				? {
						removeFields: pineconeUtils.toStringList({
							value: p.removeFields,
							propName: 'Remove Fields',
						}),
				  }
				: {}),
		});
		return { updated: true, ...response, filter: p.filter };
	},
});
