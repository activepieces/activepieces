import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeConfigureIndexOutputSchema } from '../../output-schemas';

import type { ReadCapacity } from '../../common/types';

export const pineconeConfigureIndexAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_configure_index',
	outputSchema: pineconeConfigureIndexOutputSchema,
	displayName: 'Configure Index',
	description:
		'Changes deletion protection, tags, read capacity or embedding parameters of an index.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates only the settings you set on an existing index: deletion protection, tags (a tag set to "" is removed), read capacity (on-demand or dedicated read nodes), pod replicas and pod type (existing pod-based indexes only), and the read/write parameters of a legacy integrated index\'s embedded field. Settings left empty stay as they are.',
		idempotent: true,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		deletionProtection: pineconeAiProps.deletionProtection({ required: false }),
		tags: pineconeAiProps.tags({ required: false }),
		readCapacityMode: Property.StaticDropdown<'OnDemand' | 'Dedicated', false>({
			displayName: 'Read Capacity Mode',
			description:
				'Switch read capacity. "Dedicated" also needs Dedicated Node Type, Read Replicas and Read Shards.',
			required: false,
			options: {
				options: [
					{ label: 'On-demand', value: 'OnDemand' },
					{ label: 'Dedicated', value: 'Dedicated' },
				],
			},
		}),
		readNodeType: pineconeAiProps.readNodeType({ required: false }),
		readReplicas: pineconeAiProps.readReplicas({ required: false }),
		readShards: pineconeAiProps.readShards({ required: false }),
		podReplicas: Property.Number({
			displayName: 'Pod Replicas',
			description: 'New replica count, for existing pod-based indexes only.',
			required: false,
		}),
		podType: Property.ShortText({
			displayName: 'Pod Type',
			description: 'New pod size, e.g. "p1.x2", for existing pod-based indexes only.',
			required: false,
		}),
		embedFieldName: Property.ShortText({
			displayName: 'Embedded Field Name',
			description:
				'Name of the embedded text field of a legacy integrated index (shown in Get Index schema) whose parameters you change.',
			required: false,
		}),
		embedReadParameters: Property.Json({
			displayName: 'Embedding Read Parameters',
			description:
				'New query-time model parameters for Embedded Field Name, e.g. {"input_type": "query"}.',
			required: false,
		}),
		embedWriteParameters: Property.Json({
			displayName: 'Embedding Write Parameters',
			description:
				'New write-time model parameters for Embedded Field Name, e.g. {"input_type": "passage"}.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		if (p.readCapacityMode === 'OnDemand' && p.readNodeType !== undefined) {
			throw new Error('"Dedicated Node Type" cannot be used with "Read Capacity Mode" On-demand.');
		}
		if (p.readCapacityMode === 'Dedicated' && p.readNodeType === undefined) {
			throw new Error('"Read Capacity Mode" Dedicated needs "Dedicated Node Type".');
		}
		const hasEmbedParameters =
			p.embedReadParameters !== undefined || p.embedWriteParameters !== undefined;
		if (hasEmbedParameters !== (p.embedFieldName !== undefined)) {
			throw new Error('Set "Embedded Field Name" together with its read or write parameters.');
		}
		const onDemand: ReadCapacity = { mode: 'OnDemand' };
		const readCapacity =
			p.readCapacityMode === 'OnDemand'
				? onDemand
				: pineconeUtils.toReadCapacity({
						nodeType: p.readNodeType,
						replicas: p.readReplicas,
						shards: p.readShards,
				  });
		const client = pineconeClient.create({ auth: context.auth });
		return await client.indexes.configure(p.indexName, {
			...(p.deletionProtection !== undefined ? { deletionProtection: p.deletionProtection } : {}),
			...(p.tags !== undefined
				? { tags: pineconeUtils.toStringMap({ value: p.tags, propName: 'Tags' }) }
				: {}),
			...(readCapacity !== undefined ? { readCapacity } : {}),
			...(p.podReplicas !== undefined ? { podReplicas: p.podReplicas } : {}),
			...(p.podType !== undefined ? { podType: p.podType } : {}),
			...(p.embedFieldName !== undefined
				? {
						schema: {
							fields: {
								[p.embedFieldName]: {
									type: 'semantic_text',
									...(p.embedReadParameters !== undefined
										? { readParameters: p.embedReadParameters }
										: {}),
									...(p.embedWriteParameters !== undefined
										? { writeParameters: p.embedWriteParameters }
										: {}),
								},
							},
						},
				  }
				: {}),
		});
	},
});
