import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeCreateIndexForModelOutputSchema } from '../../output-schemas';

export const pineconeCreateIndexForModelAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_create_index_for_model',
	outputSchema: pineconeCreateIndexForModelOutputSchema,
	displayName: 'Create Index for Embedding Model',
	description: 'Creates an integrated index that embeds text with a Pinecone-hosted model.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a legacy integrated index: Pinecone embeds the text in Text Field with the hosted Model on write and on search. Use Upsert Text Records and Search Text Records with it. Pick a model from List Models. The index starts initializing; check readiness with Get Index.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Index Name',
			description:
				'Unique name, 1-45 lowercase letters, digits or "-", starting and ending with a letter or digit.',
			required: true,
		}),
		cloud: pineconeAiProps.cloud({ required: true }),
		region: pineconeAiProps.region({ required: true }),
		model: Property.ShortText({
			displayName: 'Model',
			description:
				'Hosted embedding model name, from List Models, e.g. "llama-text-embed-v2" or "pinecone-sparse-english-v0".',
			required: true,
		}),
		textField: Property.ShortText({
			displayName: 'Text Field',
			description: 'Name of the record field that holds the text to embed, e.g. "chunk_text".',
			required: true,
		}),
		metric: pineconeAiProps.metric({
			required: false,
			description: "Distance metric. Defaults to the model's recommended metric.",
		}),
		dimension: Property.Number({
			displayName: 'Dimension',
			description:
				"Embedding dimension, for models that support several. Defaults to the model's default.",
			required: false,
		}),
		readParameters: Property.Json({
			displayName: 'Read Parameters',
			description:
				'Model parameters used when embedding queries, e.g. {"input_type": "query", "truncate": "END"}.',
			required: false,
		}),
		writeParameters: Property.Json({
			displayName: 'Write Parameters',
			description:
				'Model parameters used when embedding records, e.g. {"input_type": "passage", "truncate": "END"}.',
			required: false,
		}),
		deletionProtection: pineconeAiProps.deletionProtection({ required: false }),
		tags: pineconeAiProps.tags({ required: false }),
		readNodeType: pineconeAiProps.readNodeType({ required: false }),
		readReplicas: pineconeAiProps.readReplicas({ required: false }),
		readShards: pineconeAiProps.readShards({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		const readCapacity = pineconeUtils.toReadCapacity({
			nodeType: p.readNodeType,
			replicas: p.readReplicas,
			shards: p.readShards,
		});
		const client = pineconeClient.create({ auth: context.auth });
		return await client.indexes.createForModel({
			name: p.name,
			cloud: p.cloud,
			region: p.region,
			embed: {
				model: p.model,
				fieldMap: { text: p.textField },
				...(p.metric !== undefined ? { metric: p.metric } : {}),
				...(p.dimension !== undefined ? { dimension: p.dimension } : {}),
				...(p.readParameters !== undefined ? { readParameters: p.readParameters } : {}),
				...(p.writeParameters !== undefined ? { writeParameters: p.writeParameters } : {}),
			},
			...(p.deletionProtection !== undefined ? { deletionProtection: p.deletionProtection } : {}),
			...(p.tags !== undefined
				? { tags: pineconeUtils.toStringMap({ value: p.tags, propName: 'Tags' }) }
				: {}),
			...(readCapacity !== undefined ? { readCapacity } : {}),
		});
	},
});
