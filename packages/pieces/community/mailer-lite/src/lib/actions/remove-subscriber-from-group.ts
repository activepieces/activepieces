import MailerLite from '@mailerlite/mailerlite-nodejs';
import { createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../..';
import { mailerLiteCommon } from '../common';

export const removeSubscriberFromGroupAction = createAction({
	auth: mailerLiteAuth,
	name: 'remove_subscriber_from_group',
	displayName: 'Remove Subscriber from a Group',
	description: 'Removes subscriber from a specific group.',
	props: {
		subscriberId: mailerLiteCommon.subscriberId(true),
		subscriberGroupId: mailerLiteCommon.subscriberGroupId(true),
	},
	async run(context) {
		const client = new MailerLite({ api_key: context.auth });
		const response = await client.groups.unAssignSubscriber(
			context.propsValue.subscriberId!,
			context.propsValue.subscriberGroupId!,
		);
		return response.data;
	},
});
