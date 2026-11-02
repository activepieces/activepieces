import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookMessageActionOutputSchema } from '../output-schemas';

export const outlookSetMessageReadStatusAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_set_message_read_status',
	classification: 'WRITE',
	displayName: 'Mark Message Read / Unread',
	description: 'Marks a message as read or unread.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Sets only the read state of one message, leaving every other property untouched. Use this for the common mark-as-read step; use Update Message when other fields change too, or Batch Update Messages for many messages at once. Idempotent: re-applying the same state changes nothing.',
		idempotent: true,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: outlookAtomicCommon.messageIdHint,
			required: true,
		}),
		isRead: Property.StaticDropdown({
			displayName: 'Read State',
			required: true,
			defaultValue: 'true',
			options: {
				disabled: false,
				options: [
					{ label: 'Mark as read', value: 'true' },
					{ label: 'Mark as unread', value: 'false' },
				],
			},
		}),
	},
	outputSchema: outlookMessageActionOutputSchema,
	async run(context) {
		const { messageId, isRead } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			return await client
				.api(`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}`)
				.headers(outlookAtomicCommon.textBodyHeaders)
				.patch({ isRead: isRead === 'true' });
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Updating the read state of the Outlook message',
			});
		}
	},
});
