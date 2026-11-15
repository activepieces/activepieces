import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderUtils } from '../../common/utils';
import { senderSuccessOutputSchema } from '../../output-schemas';

export const senderDeleteGroupAction = createAction({
	auth: senderAuth,
	name: 'sender_delete_group',
	outputSchema: senderSuccessOutputSchema,
	displayName: 'Delete Group',
	description: 'Deletes a group.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes a subscriber group. Its subscribers stay in the account unless Delete Subscribers is Yes, which also deletes every subscriber in the group. Cannot be undone.',
		idempotent: false,
	},
	props: {
		groupId: senderAiProps.groupId({ required: true }),
		deleteSubscribers: senderAiProps.yesNo({
			required: false,
			displayName: 'Delete Subscribers',
			description: 'Also delete the subscribers in this group. Defaults to No.',
		}),
	},
	async run(context) {
		return await senderApi.deleteGroup({
			auth: context.auth,
			groupId: context.propsValue.groupId,
			deleteSubscribers: senderUtils.yesNoToBoolean(context.propsValue.deleteSubscribers),
		});
	},
});
