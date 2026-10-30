import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeUpsertDocumentsOutputSchema } from '../../output-schemas';

export const pineconeUpsertDocumentsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_upsert_documents',
	outputSchema: pineconeUpsertDocumentsOutputSchema,
	displayName: 'Upsert Documents',
	description: 'Inserts or replaces documents in a namespace of a documents index.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Writes documents into a namespace; a document with an existing "_id" is replaced whole. Each document is {"_id": "...", <field>: <value>} where fields match the index schema (text fields, "embedding" dense values) plus any metadata fields. Works only on documents indexes (created by Create Index with Full-Text Fields).',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		namespace: pineconeAiProps.namespace({ required: false }),
		documents: Property.Array({
			displayName: 'Documents',
			description:
				'Documents to write, e.g. [{"_id": "doc-1", "title": "Intro", "body": "Pinecone is a vector database.", "year": 2024}].',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const documents = client.index({
			name: p.indexName,
			...(p.namespace !== undefined ? { namespace: p.namespace } : {}),
		}).documents;
		return await documents.upsert({
			documents: pineconeUtils.toDocuments({ value: p.documents, propName: 'Documents' }),
		});
	},
});
