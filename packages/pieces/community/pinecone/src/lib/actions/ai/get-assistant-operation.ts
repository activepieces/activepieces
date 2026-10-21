import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeGetAssistantOperationOutputSchema } from '../../output-schemas';

export const pineconeGetAssistantOperationAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_get_assistant_operation',
	outputSchema: pineconeGetAssistantOperationOutputSchema,
	displayName: 'Get Assistant Operation',
	description: 'Gets the status of one assistant file operation.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one assistant file operation by ID, once: status, percent done and any error. Use it to poll Upload, Replace or Delete Assistant File.',
		idempotent: true,
	},
	props: {
		assistantName: Property.ShortText({
			displayName: 'Assistant Name',
			description: 'Name of the assistant, from List Assistants.',
			required: true,
		}),
		operationId: Property.ShortText({
			displayName: 'Operation ID',
			description:
				'Operation ID, from Upload, Replace or Delete Assistant File, or List Assistant Operations.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const assistant = client.assistant({ name: p.assistantName });
		return await assistant.describeOperation(p.operationId);
	},
});
