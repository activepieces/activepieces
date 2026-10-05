import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import { commonProps } from '../common/utils';
import { whatsappProps } from '../common/props';
import { whatsappClient } from '../common/client';
import { markMessageAsReadOutputSchema } from '../output-schemas';

export const markMessageAsRead = createAction({
	auth: whatsappAuth,
	name: 'mark_message_as_read',
	outputSchema: markMessageAsReadOutputSchema,
	classification: 'WRITE',
	displayName: 'Mark Message As Read',
	description: 'Shows the sender blue ticks for a received message, optionally with a typing indicator.',
	audience: 'both',
	aiMetadata: {
		description:
			'Marks an incoming WhatsApp message as read so the sender sees blue ticks, and can show a typing indicator for up to 25 seconds while you prepare a reply. Use it right after the New Incoming Message trigger, before sending a response. Idempotent — marking an already-read message again is a no-op.',
		idempotent: true,
	},
	props: {
		phone_number_id: commonProps.phone_number_id,
		message_id: whatsappProps.messageId,
		show_typing_indicator: Property.Checkbox({
			displayName: 'Show Typing Indicator',
			description: 'Display "typing…" to the sender until you reply or 25 seconds pass.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { phone_number_id, message_id, show_typing_indicator } = context.propsValue;
		return whatsappClient.request<{ success: boolean }>({
			accessToken: context.auth.props.access_token,
			method: HttpMethod.POST,
			path: `/${phone_number_id}/messages`,
			body: {
				messaging_product: 'whatsapp',
				status: 'read',
				message_id,
				...(show_typing_indicator ? { typing_indicator: { type: 'text' } } : {}),
			},
		});
	},
});
