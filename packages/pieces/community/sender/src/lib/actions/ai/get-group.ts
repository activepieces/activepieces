import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderGetGroupOutputSchema } from '../../output-schemas';

export const senderGetGroupAction = createAction({
	auth: senderAuth,
	name: 'sender_get_group',
	outputSchema: senderGetGroupOutputSchema,
	displayName: 'Get Group',
	description: 'Gets a group by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one subscriber group by ID, with its title and active, unsubscribed, bounced and phone subscriber counts.',
		idempotent: true,
	},
	props: {
		groupId: senderAiProps.groupId({ required: true }),
	},
	async run(context) {
		return await senderApi.getGroup({ auth: context.auth, ...context.propsValue });
	},
});
