import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderUtils } from '../../common/utils';
import { senderAddSubscribersToGroupOutputSchema } from '../../output-schemas';

export const senderAddSubscribersToGroupAction = createAction({
	auth: senderAuth,
	name: 'sender_add_subscribers_to_group',
	outputSchema: senderAddSubscribersToGroupOutputSchema,
	displayName: 'Add Subscribers to Group',
	description: 'Adds subscribers to a group.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds existing subscribers, by email, to one group without touching their other groups. The response lists emails that were added and emails that do not exist in the account; create those with Create or Update Subscriber first. Repeating it leaves membership unchanged.',
		idempotent: true,
	},
	props: {
		groupId: senderAiProps.groupId({ required: true }),
		subscribers: senderAiProps.subscribers({ required: true }),
		triggerAutomation: senderAiProps.triggerAutomation({ required: false }),
	},
	async run(context) {
		const { groupId, subscribers, triggerAutomation } = context.propsValue;
		return await senderApi.addSubscribersToGroup({
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
