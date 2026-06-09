import MailerLite from '@mailerlite/mailerlite-nodejs';
import { createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../..';
import { mailerLiteCommon } from '../common';

export const addSubscriberToGroupAction = createAction({
	auth: mailerLiteAuth,
	name: 'add_subscriber_to_group',
	displayName: 'Add Subscriber to a Group',
	description: 'Adds existing subscriber to a specific group.',
	audience: 'both',
	aiMetadata: {
		description:
			'Assign an existing MailerLite subscriber to a group, given the subscriber ID and group ID. Use this to segment a contact you already have into a list/group. The subscriber must already exist. Idempotent — re-running for a subscriber already in the group leaves membership unchanged.',
		idempotent: true,
	},
	props: {
		subscriberId: mailerLiteCommon.subscriberId(true),
		subscriberGroupId: mailerLiteCommon.subscriberGroupId(true),
	},
	async run(context) {
		const client = new MailerLite({ api_key: context.auth.secret_text });
		const response = await client.groups.assignSubscriber(
			context.propsValue.subscriberId!,
			context.propsValue.subscriberGroupId!,
		);
		return response.data;
	},
});
