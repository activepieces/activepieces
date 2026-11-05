import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxCancelScheduledMessageAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_cancel_scheduled_message',
	displayName: 'Cancel Scheduled Message',
	description: 'Cancels a message that has not been sent yet.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Cancels a scheduled message before its send time, using the id from Schedule Message. Fails once the message has been sent or already cancelled.',
		idempotent: false,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: 'ID of the scheduled message, returned by Schedule Message.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.cancelScheduledMessage({
			auth: context.auth,
			messageId: context.propsValue.messageId,
		});
	},
});
