import { createAction, Property } from '@activepieces/pieces-framework';
import { whatsappAuth } from '../auth';
import { commonProps } from '../common/utils';
import { whatsappProps } from '../common/props';
import { whatsappClient } from '../common/client';
import { messageSendOutputSchema } from '../output-schemas';

export const sendReaction = createAction({
	auth: whatsappAuth,
	name: 'send_reaction',
	outputSchema: messageSendOutputSchema,
	classification: 'WRITE',
	displayName: 'Send Reaction',
	description: 'Reacts to a message with an emoji, or removes an existing reaction.',
	audience: 'both',
	aiMetadata: {
		description:
			'Adds an emoji reaction to a specific WhatsApp message, or removes the reaction when the emoji is left empty. Choose this over Send Message to acknowledge a message without sending a new bubble. The target must be a message from the last 30 days that is not itself a reaction. Idempotent — reacting again with the same emoji leaves the same single reaction in place.',
		idempotent: true,
	},
	props: {
		phone_number_id: commonProps.phone_number_id,
		to: whatsappProps.to,
		message_id: whatsappProps.messageId,
		emoji: Property.ShortText({
			displayName: 'Emoji',
			description: 'A single emoji such as 👍. Leave empty to remove your reaction.',
			required: false,
		}),
	},
	async run(context) {
		const { phone_number_id, to, message_id, emoji } = context.propsValue;
		return whatsappClient.sendMessage({
			accessToken: context.auth.props.access_token,
			phoneNumberId: phone_number_id,
			to,
			payload: {
				type: 'reaction',
				reaction: { message_id, emoji: emoji ?? '' },
			},
		});
	},
});
