import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderUtils } from '../../common/utils';
import { senderRemoveSubscribersFromGroupOutputSchema } from '../../output-schemas';

export const senderRemoveSubscribersFromGroupAction = createAction({
	auth: senderAuth,
	name: 'sender_remove_subscribers_from_group',
	outputSchema: senderRemoveSubscribersFromGroupOutputSchema,
	displayName: 'Remove Subscribers from Group',
	description: 'Removes subscribers from a group.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Removes subscribers, by email, from one group. They stay in the account and in their other groups; to unsubscribe them use Update Subscriber. Repeating it leaves membership unchanged.',
		idempotent: true,
	},
	props: {
		groupId: senderAiProps.groupId({ required: true }),
		subscribers: senderAiProps.subscribers({ required: true }),
		triggerAutomation: senderAiProps.triggerAutomation({ required: false }),
	},
	async run(context) {
		const { groupId, subscribers, triggerAutomation } = context.propsValue;
		return await senderApi.removeSubscribersFromGroup({
			auth: context.auth,
			groupId,
			subscribers: senderUtils.requiredStringList({
				value: subscribers,
				propName: 'Subscriber Emails',
			}),
			triggerAutomation: senderUtils.yesNoToBoolean(triggerAutomation),
		});
	},
});
