import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeCreateIndexOutputSchema } from '../../output-schemas';

import type { CreateIndexSchemaField, PineconeIndexDeployment } from '../../common/types';

export const pineconeCreateIndexAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_create_index',
	outputSchema: pineconeCreateIndexOutputSchema,
	displayName: 'Create Index',
	description: 'Creates a serverless index for vectors or for documents with full-text search.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a serverless index. Without Full-Text Fields it is a vectors index (dense "_values" and/or sparse "_sparse_values"), which the vector actions (Upsert Vectors, Query Vectors…) work with. With Full-Text Fields it is a documents index, which only the document actions work with; its dense field is named "embedding" and its sparse field "sparse_embedding". Set at least one of Dense Dimension, Include Sparse Vectors or Full-Text Fields. The index starts initializing; check readiness with Get Index.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Index Name',
			description:
				'Unique name, 1-45 lowercase letters, digits or "-", starting and ending with a letter or digit.',
			required: true,
		}),
		denseDimension: Property.Number({
			displayName: 'Dense Dimension',
			description:
				'Dimension of the dense vectors, e.g. 1536. Must match the embedding model you use.',
			required: false,
		}),
		metric: pineconeAiProps.metric({
			required: false,
			description:
				'Distance metric for the dense vectors: cosine, euclidean or dotproduct. Defaults to cosine.',
		}),
		includeSparseVectors: Property.Checkbox({
			displayName: 'Include Sparse Vectors',
			description: 'Add a sparse vector field for keyword or hybrid search.',
			required: false,
		}),
		fullTextFields: Property.Array({
			displayName: 'Full-Text Fields',
			description:
				'Names of document text fields searched by full-text search, e.g. ["title", "body"]. Setting this makes a documents index.',
			required: false,
		}),
		fullTextLanguage: Property.ShortText({
			displayName: 'Full-Text Language',
			description: 'Language code for full-text search, e.g. "en". Defaults to "en".',
			required: false,
		}),
		cloud: pineconeAiProps.cloud({
			required: false,
			description:
				'Public cloud for the index: aws, gcp or azure. Set together with Region; defaults to aws us-east-1.',
		}),
		region: pineconeAiProps.region({ required: false }),
		deletionProtection: pineconeAiProps.deletionProtection({ required: false }),
		tags: pineconeAiProps.tags({ required: false }),
		readNodeType: pineconeAiProps.readNodeType({ required: false }),
		readReplicas: pineconeAiProps.readReplicas({ required: false }),
		readShards: pineconeAiProps.readShards({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		if ((p.cloud === undefined) !== (p.region === undefined)) {
			throw new Error('Set "Cloud" and "Region" together, or leave both empty.');
		}
		const textFields = p.fullTextFields
			? pineconeUtils.toStringList({ value: p.fullTextFields, propName: 'Full-Text Fields' })
			: [];
		const isDocumentsIndex = textFields.length > 0;
		const fields: Record<string, CreateIndexSchemaField> = {
			...(p.denseDimension !== undefined
				? {
						[isDocumentsIndex ? 'embedding' : '_values']: {
							type: 'dense_vector',
							dimension: p.denseDimension,
							metric: p.metric ?? 'cosine',
						},
				  }
				: {}),
			...(p.includeSparseVectors
				? { [isDocumentsIndex ? 'sparse_embedding' : '_sparse_values']: { type: 'sparse_vector' } }
				: {}),
			...Object.fromEntries(
				textFields.map((field): [string, CreateIndexSchemaField] => [
					field,
					{ type: 'string', fullTextSearch: { language: p.fullTextLanguage ?? 'en' } },
				]),
			),
		};
		const readCapacity = pineconeUtils.toReadCapacity({
			nodeType: p.readNodeType,
			replicas: p.readReplicas,
			shards: p.readShards,
		});
		const deployment: PineconeIndexDeployment =
			p.cloud !== undefined && p.region !== undefined
				? { deploymentType: 'managed', cloud: p.cloud, region: p.region }
				: undefined;
		const client = pineconeClient.create({ auth: context.auth });
		return await client.indexes.create({
			name: p.name,
			schema: { fields },
			...(deployment !== undefined ? { deployment } : {}),
			...(p.deletionProtection !== undefined ? { deletionProtection: p.deletionProtection } : {}),
			...(p.tags !== undefined
				? { tags: pineconeUtils.toStringMap({ value: p.tags, propName: 'Tags' }) }
				: {}),
			...(readCapacity !== undefined ? { readCapacity } : {}),
		});
	},
});
