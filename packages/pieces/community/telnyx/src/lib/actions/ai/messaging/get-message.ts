import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetMessageAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_message',
	displayName: 'Get Message',
	description: 'Gets a message and its delivery status.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one inbound or outbound message by id, including its per-recipient delivery status, cost and errors. Use the id returned by Send Message, Schedule Message or the Message Received trigger. Telnyx keeps message records for a limited time.',
		idempotent: true,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: 'Message UUID, returned by Send Message or Schedule Message.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getMessage({
			auth: context.auth,
			messageId: context.propsValue.messageId,
		});
	},
});
