import MailerLite from '@mailerlite/mailerlite-nodejs';
import { createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../..';
import { mailerLiteCommon } from '../common';

export const addSubscriberToGroupAction = createAction({
	auth: mailerLiteAuth,
	name: 'add_subscriber_to_group',
	displayName: 'Add Subscriber to a Group',
	description: 'Adds existing subscriber to a specific group.',
	props: {
		subscriberId: mailerLiteCommon.subscriberId(true),
		subscriberGroupId: mailerLiteCommon.subscriberGroupId(true),
	},
	async run(context) {
		const client = new MailerLite({ api_key: context.auth });
		const response = await client.groups.assignSubscriber(
			context.propsValue.subscriberId!,
			context.propsValue.subscriberGroupId!,
		);
		return response.data;
	},
});
