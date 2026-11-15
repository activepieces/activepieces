import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeUpdateAssistantOutputSchema } from '../../output-schemas';

export const pineconeUpdateAssistantAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_update_assistant',
	outputSchema: pineconeUpdateAssistantOutputSchema,
	displayName: 'Update Assistant',
	description: "Changes an assistant's instructions or metadata.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates only what you set on an assistant: instructions, and metadata (replaces the whole metadata object). Settings left empty stay as they are.',
		idempotent: true,
	},
	props: {
		assistantName: Property.ShortText({
			displayName: 'Assistant Name',
			description: 'Name of the assistant, from List Assistants.',
			required: true,
		}),
		instructions: Property.LongText({
			displayName: 'Instructions',
			description: 'New directions for how the assistant answers.',
			required: false,
		}),
		metadata: Property.Json({
			displayName: 'Metadata',
			description: 'New string key-value pairs; replaces the current metadata.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		if (p.instructions === undefined && p.metadata === undefined) {
			throw new Error('Set "Instructions" or "Metadata" to update.');
		}
		const client = pineconeClient.create({ auth: context.auth });
		return await client.assistants.update({
			name: p.assistantName,
			...(p.instructions !== undefined ? { instructions: p.instructions } : {}),
			...(p.metadata !== undefined
				? { metadata: pineconeUtils.toStringMap({ value: p.metadata, propName: 'Metadata' }) }
				: {}),
		});
	},
});
