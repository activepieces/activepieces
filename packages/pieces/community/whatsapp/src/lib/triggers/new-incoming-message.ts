import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { whatsappAuth } from '../auth';
import { phoneNumberDropdown } from '../common/utils';
import { whatsappWebhook } from '../common/webhook';
import { newIncomingMessageOutputSchema } from '../output-schemas';

export const newIncomingMessage = createTrigger({
	auth: whatsappAuth,
	name: 'new_incoming_message',
	outputSchema: newIncomingMessageOutputSchema,
	classification: 'READ',
	displayName: 'New Incoming Message',
	description: 'Fires when a customer sends your business number a message.',
	aiMetadata: {
		description:
			'Fires once per message a WhatsApp user sends to the business number: text, media, location, contacts, interactive button or list replies. Reactions are excluded and have their own trigger. The payload is flattened with the sender, message id, type-specific fields and a media id you can pass to Download Media; receiving a message opens the 24-hour window for free-form replies.',
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
		timestamp: '1789520000',
		received_at: '2026-09-16T00:53:20.000Z',
		type: 'text',
		phone_number_id: '1285944454608901',
		display_phone_number: '15551394669',
		text: 'Hello, I would like to know my order status.',
		caption: null,
		media_id: null,
		mime_type: null,
		sha256: null,
		filename: null,
		latitude: null,
		longitude: null,
		location_name: null,
		location_address: null,
		interactive_type: null,
		interactive_reply_id: null,
		interactive_reply_title: null,
		interactive_reply_description: null,
		button_payload: null,
		button_text: null,
		reaction_emoji: null,
		reaction_message_id: null,
		context_message_id: null,
		context_from: null,
		forwarded: false,
		raw: {
			from: '962782550213',
			id: 'wamid.HBgMOTYyNzgyNTUwMjEzFQIAEhgUM0E3RjM1QjQ1RTk0RkY1RkQ4QjcA',
			timestamp: '1789520000',
			type: 'text',
			text: { body: 'Hello, I would like to know my order status.' },
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
					.filter((message) => message.type !== 'reaction')
					.map((message) => whatsappWebhook.flattenIncomingMessage({ message, value })),
			);
	},
});
