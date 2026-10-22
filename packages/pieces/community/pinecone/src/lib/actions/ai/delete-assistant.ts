import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeDeleteAssistantOutputSchema } from '../../output-schemas';

export const pineconeDeleteAssistantAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_delete_assistant',
	outputSchema: pineconeDeleteAssistantOutputSchema,
	displayName: 'Delete Assistant',
	description: 'Permanently deletes an assistant and its files.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes an assistant and every file uploaded to it; this cannot be undone.',
		idempotent: false,
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
		await client.assistants.delete(p.assistantName);
		return { deleted: true, assistantName: p.assistantName };
	},
});
