import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { whatsappAuth } from '../auth';
import { phoneNumberDropdown } from '../common/utils';
import { whatsappWebhook } from '../common/webhook';
import { newMessageReactionOutputSchema } from '../output-schemas';

export const newMessageReaction = createTrigger({
	auth: whatsappAuth,
	name: 'new_message_reaction',
	outputSchema: newMessageReactionOutputSchema,
	classification: 'READ',
	displayName: 'New Message Reaction',
	description: 'Fires when a customer reacts to one of your messages with an emoji, or removes a reaction.',
	aiMetadata: {
		description:
			'Fires once each time a WhatsApp user adds or removes an emoji reaction on a message from the business number. The payload carries the reacted-to message id and the emoji; an empty emoji means the reaction was removed. Use New Incoming Message for every other message type.',
	},
	type: TriggerStrategy.WEBHOOK,
	props: {
		instructions: whatsappWebhook.setupInstructions,
		verify_token: whatsappWebhook.verifyToken,
		phone_number_id: phoneNumberDropdown({ required: false }),
	},
	sampleData: {
		message_id: 'wamid.HBgMOTYyNzgyNTUwMjEzFQIAEhgUM0E3RjM1QjQ1RTk0RkY1RkQ4QjcA',
		from: '962782550213',
		contact_name: 'Odai',
		timestamp: '1789520100',
		received_at: '2026-09-16T00:55:00.000Z',
		type: 'reaction',
		phone_number_id: '1285944454608901',
		display_phone_number: '15551394669',
		reaction_emoji: '👍',
		reaction_message_id: 'wamid.HBgMOTYyNzgyNTUwMjEzFQIAERgSRTAwNUQyMjA1MTA2QUIxODREAA==',
		context_message_id: null,
		context_from: null,
		forwarded: false,
		raw: {
			from: '962782550213',
			id: 'wamid.HBgMOTYyNzgyNTUwMjEzFQIAEhgUM0E3RjM1QjQ1RTk0RkY1RkQ4QjcA',
			timestamp: '1789520100',
			type: 'reaction',
			reaction: { message_id: 'wamid.HBgMOTYyNzgyNTUwMjEzFQIAERgSRTAwNUQyMjA1MTA2QUIxODREAA==', emoji: '👍' },
		},
	},
	handshakeConfiguration: whatsappWebhook.handshakeConfiguration,
	async onHandshake(context) {
		return whatsappWebhook.handleHandshake({
			queryParams: context.payload.queryParams,
			expectedToken: context.propsValue.verify_token,
		});
	},
	async onEnable() {
		return;
	},
	async onDisable() {
		return;
	},
	async run(context) {
		if (!whatsappWebhook.isSignedByMeta({ appSecret: context.auth.props.app_secret, headers: context.payload.headers, rawBody: context.payload.rawBody })) {
			return [];
		}
		const phoneNumberId = context.propsValue.phone_number_id;
		return whatsappWebhook
			.extractChanges({ body: context.payload.body, field: 'messages' })
			.filter((value) => whatsappWebhook.matchesPhoneNumber({ value, phoneNumberId }))
			.flatMap((value) =>
				(value.messages ?? [])
					.filter((message) => message.type === 'reaction')
					.map((message) => {
						const flat = whatsappWebhook.flattenIncomingMessage({ message, value });
						return {
							message_id: flat.message_id,
							from: flat.from,
							contact_name: flat.contact_name,
							timestamp: flat.timestamp,
							received_at: flat.received_at,
							type: flat.type,
							phone_number_id: flat.phone_number_id,
							display_phone_number: flat.display_phone_number,
							reaction_emoji: flat.reaction_emoji,
							reaction_message_id: flat.reaction_message_id,
							context_message_id: flat.context_message_id,
							context_from: flat.context_from,
							forwarded: flat.forwarded,
							raw: flat.raw,
						};
					}),
			);
	},
});
