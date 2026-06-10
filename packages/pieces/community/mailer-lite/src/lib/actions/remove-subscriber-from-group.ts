import MailerLite from '@mailerlite/mailerlite-nodejs';
import { createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../..';
import { mailerLiteCommon } from '../common';

export const removeSubscriberFromGroupAction = createAction({
	auth: mailerLiteAuth,
	name: 'remove_subscriber_from_group',
	displayName: 'Remove Subscriber from a Group',
	description: 'Removes subscriber from a specific group.',
	audience: 'both',
	aiMetadata: {
		description:
			'Unassign a MailerLite subscriber from a group, given the subscriber ID and group ID. Use this to remove a contact from a specific list/group without deleting the subscriber. Idempotent — re-running for a subscriber not in the group leaves membership unchanged.',
		idempotent: true,
	},
	props: {
		subscriberId: mailerLiteCommon.subscriberId(true),
		subscriberGroupId: mailerLiteCommon.subscriberGroupId(true),
	},
	async run(context) {
		const client = new MailerLite({ api_key: context.auth.secret_text });
		const response = await client.groups.unAssignSubscriber(
			context.propsValue.subscriberId!,
			context.propsValue.subscriberGroupId!,
		);
		return response.data;
	},
});
