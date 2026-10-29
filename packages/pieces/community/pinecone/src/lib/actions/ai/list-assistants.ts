import { createAction } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeListAssistantsOutputSchema } from '../../output-schemas';

export const pineconeListAssistantsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_list_assistants',
	outputSchema: pineconeListAssistantsOutputSchema,
	displayName: 'List Assistants',
	description: 'Lists the assistants in the project.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every assistant in the project with its name, status, host, instructions and metadata. Use the name with the other assistant actions.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const client = pineconeClient.create({ auth: context.auth });
		return await client.assistants.list();
	},
});
