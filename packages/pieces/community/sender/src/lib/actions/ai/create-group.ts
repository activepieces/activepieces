import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderApi } from '../../common/api';
import { senderGroupWriteOutputSchema } from '../../output-schemas';

export const senderCreateGroupAction = createAction({
	auth: senderAuth,
	name: 'sender_create_group',
	outputSchema: senderGroupWriteOutputSchema,
	displayName: 'Create Group',
	description: 'Creates a subscriber group.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a new, empty subscriber group with the given title and returns it with its ID. Each call creates a separate group, even with the same title.',
		idempotent: false,
	},
	props: {
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Name of the new group.',
			required: true,
		}),
	},
	async run(context) {
		return await senderApi.createGroup({ auth: context.auth, ...context.propsValue });
	},
});
