import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomRequest } from '../common';
import { resolveAdminId } from '../common/client';
import { requireText, toUnixSeconds } from '../common/lookups';
import { conversationOutputSchema } from '../output-schemas';

export const setConversationStateAction = createAction({
	auth: intercomAuth,
	name: 'set_conversation_state',
	classification: 'WRITE',
	displayName: 'Close, Reopen or Snooze Conversation',
	description: 'Closes, reopens or snoozes a conversation.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Closes, reopens or snoozes a conversation until a future time, by conversation ID. A closing message, if given, is shown to the customer and is posted again on every call, so the action is not marked idempotent; without one, setting the same state again leaves the same state.',
		idempotent: false,
	},
	props: {
		conversationId: Property.ShortText({ displayName: 'Conversation ID', required: true }),
		state: Property.StaticDropdown({
			displayName: 'New State',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Close', value: 'close' },
					{ label: 'Reopen', value: 'open' },
					{ label: 'Snooze', value: 'snoozed' },
				],
			},
		}),
		snoozedUntil: Property.DateTime({
			displayName: 'Snooze Until',
			description: 'Required for Snooze; must be in the future.',
			required: false,
		}),
		closingMessage: Property.LongText({
			displayName: 'Closing Message',
			description: 'Optional, Close only. The customer sees this message.',
			required: false,
		}),
		adminId: Property.ShortText({
			displayName: 'Acting Admin ID',
			description: 'Leave empty to act as the admin who owns this connection.',
			required: false,
		}),
	},
	outputSchema: conversationOutputSchema,
	async run(context) {
		const conversationId = requireText({ label: 'Conversation ID', value: context.propsValue.conversationId });
		const { state, snoozedUntil } = context.propsValue;
		const closingMessage = context.propsValue.closingMessage?.trim() || undefined;
		if (state !== 'close' && state !== 'open' && state !== 'snoozed') {
			throw new Error('New State must be close, open or snoozed.');
		}
		if (closingMessage && state !== 'close') {
			throw new Error('A closing message can only be sent when closing the conversation.');
		}
		const snoozeUntil =
			state === 'snoozed'
				? toUnixSeconds({ label: 'Snooze Until', value: requireText({ label: 'Snooze Until', value: snoozedUntil }) })
				: undefined;
		if (snoozeUntil !== undefined && snoozeUntil <= Math.floor(Date.now() / 1000)) {
			throw new Error('Snooze Until must be in the future.');
		}
		const adminId = await resolveAdminId({ auth: context.auth, adminId: context.propsValue.adminId });
		const body =
			state === 'close'
				? { message_type: 'close', type: 'admin', admin_id: adminId, body: closingMessage }
				: state === 'open'
				? { message_type: 'open', admin_id: adminId }
				: { message_type: 'snoozed', admin_id: adminId, snoozed_until: snoozeUntil };
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: ['conversations', conversationId, 'parts'],
			body,
			operation: 'change the conversation state',
		});
	},
});
