import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeCreateAssistantOutputSchema } from '../../output-schemas';

export const pineconeGetAssistantAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_get_assistant',
	outputSchema: pineconeCreateAssistantOutputSchema,
	displayName: 'Get Assistant',
	description: 'Gets one assistant and its status.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one assistant by name: status (Initializing, Ready, Failed\u2026), host, instructions and metadata.',
		idempotent: true,
	},
	props: {
		assistantName: Property.ShortText({
			displayName: 'Assistant Name',
			description: 'Name of the assistant, from List Assistants.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		return await client.assistants.describe(p.assistantName);
	},
});
