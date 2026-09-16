import { Property, WebhookHandshakeStrategy, WebhookResponse } from '@activepieces/pieces-framework';
import { inputUtils } from './inputs';

const setupInstructions = Property.MarkDown({
	value: `
**Connect this trigger to your Meta app**

1. Open [developers.facebook.com](https://developers.facebook.com/apps), pick your app and go to **WhatsApp → Configuration**.
2. Under **Webhook**, click **Edit** and paste this URL as the Callback URL:

   \`{{webhookUrl}}\`

3. Enter the same value you put in **Verify Token** below (any secret string), then click **Verify and save**.
4. Click **Manage** next to Webhook fields and subscribe to **messages** (and **message_template_status_update** for template triggers).

Meta sends one callback URL per app, so every WhatsApp trigger in your flows receives every event and filters what it needs.
`,
});

const verifyToken = Property.ShortText({
	displayName: 'Verify Token',
	description: 'Optional. If set, Meta must send this exact token during webhook verification or the handshake is rejected.',
	required: false,
});

const handshakeConfiguration = {
	strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
	paramName: 'hub.challenge',
} as const;

function handleHandshake({ queryParams, expectedToken }: HandshakeParams): WebhookResponse {
	const challenge = queryParams['hub.challenge'];
	const sentToken = queryParams['hub.verify_token'];
	if (expectedToken && sentToken !== expectedToken) {
		return { status: 403, body: 'verify token mismatch', headers: { 'Content-Type': 'text/plain' } };
	}
	return { status: 200, body: challenge ?? '', headers: { 'Content-Type': 'text/plain' } };
}

function extractChanges({ body, field }: ExtractChangesParams): ChangeValue[] {
	if (!isWebhookBody(body)) {
		return [];
	}
	return (body.entry ?? []).flatMap((entry) =>
		(entry.changes ?? [])
			.filter((change) => change.field === field)
			.map((change) => ({ ...change.value, waba_id: entry.id })),
	);
}

function matchesPhoneNumber({ value, phoneNumberId }: MatchPhoneParams): boolean {
	return !phoneNumberId || value.metadata?.phone_number_id === phoneNumberId;
}

function flattenIncomingMessage({ message, value }: FlattenMessageParams): FlatIncomingMessage {
	const contact = value.contacts?.find((entry) => entry.wa_id === message.from) ?? value.contacts?.[0];
	const media =
		message.image ?? message.video ?? message.audio ?? message.document ?? message.sticker ?? undefined;
	const interactiveReply = message.interactive?.button_reply ?? message.interactive?.list_reply;
	return {
		message_id: message.id,
		from: message.from,
		contact_name: contact?.profile?.name ?? null,
		timestamp: message.timestamp,
		received_at: toIso(message.timestamp),
		type: message.type,
		phone_number_id: value.metadata?.phone_number_id ?? null,
		display_phone_number: value.metadata?.display_phone_number ?? null,
		text: message.text?.body ?? null,
		caption: media?.caption ?? null,
		media_id: media?.id ?? null,
		mime_type: media?.mime_type ?? null,
		sha256: media?.sha256 ?? null,
		filename: message.document?.filename ?? null,
		latitude: message.location?.latitude ?? null,
		longitude: message.location?.longitude ?? null,
		location_name: message.location?.name ?? null,
		location_address: message.location?.address ?? null,
		interactive_type: message.interactive?.type ?? null,
		interactive_reply_id: interactiveReply?.id ?? null,
		interactive_reply_title: interactiveReply?.title ?? null,
		interactive_reply_description: message.interactive?.list_reply?.description ?? null,
		button_payload: message.button?.payload ?? null,
		button_text: message.button?.text ?? null,
		reaction_emoji: message.reaction?.emoji ?? null,
		reaction_message_id: message.reaction?.message_id ?? null,
		context_message_id: message.context?.id ?? null,
		context_from: message.context?.from ?? null,
		forwarded: message.context?.forwarded ?? false,
		raw: message,
	};
}

function flattenStatus({ status, value }: FlattenStatusParams): FlatStatus {
	const error = status.errors?.[0];
	return {
		message_id: status.id,
		status: status.status,
		recipient_id: status.recipient_id,
		timestamp: status.timestamp,
		updated_at: toIso(status.timestamp),
		phone_number_id: value.metadata?.phone_number_id ?? null,
		display_phone_number: value.metadata?.display_phone_number ?? null,
		conversation_id: status.conversation?.id ?? null,
		conversation_origin: status.conversation?.origin?.type ?? null,
		conversation_expires_at: toIso(status.conversation?.expiration_timestamp),
		billable: status.pricing?.billable ?? null,
		pricing_model: status.pricing?.pricing_model ?? null,
		pricing_category: status.pricing?.category ?? null,
		error_code: error?.code ?? null,
		error_title: error?.title ?? null,
		error_message: error?.message ?? null,
		error_details: error?.error_data?.details ?? null,
		raw: status,
	};
}

function toIso(unixSeconds?: string): string | null {
	if (!unixSeconds) return null;
	const seconds = Number(unixSeconds);
	return Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString() : null;
}

function isWebhookBody(body: unknown): body is WebhookBody {
	return inputUtils.isRecord(body) && body['object'] === 'whatsapp_business_account' && Array.isArray(body['entry']);
}

export const whatsappWebhook = {
	setupInstructions,
	verifyToken,
	handshakeConfiguration,
	handleHandshake,
	extractChanges,
	matchesPhoneNumber,
	flattenIncomingMessage,
	flattenStatus,
};

export type ChangeValue = {
	waba_id: string;
	messaging_product?: string;
	metadata?: { display_phone_number?: string; phone_number_id?: string };
	contacts?: { profile?: { name?: string }; wa_id: string }[];
	messages?: IncomingMessage[];
	statuses?: MessageStatus[];
	event?: string;
	message_template_id?: number | string;
	message_template_name?: string;
	message_template_language?: string;
	reason?: string | null;
	disable_info?: { disable_date?: string };
	other_info?: { title?: string; description?: string };
	rejection_info?: { reason?: string; recommendation?: string };
};

export type IncomingMessage = {
	from: string;
	id: string;
	timestamp: string;
	type: string;
	text?: { body: string };
	image?: MediaObject;
	video?: MediaObject;
	audio?: MediaObject;
	document?: MediaObject & { filename?: string };
	sticker?: MediaObject;
	location?: { latitude: number; longitude: number; name?: string; address?: string };
	contacts?: unknown[];
	reaction?: { message_id: string; emoji?: string };
	interactive?: {
		type: string;
		button_reply?: { id: string; title: string };
		list_reply?: { id: string; title: string; description?: string };
	};
	button?: { payload: string; text: string };
	context?: { from?: string; id?: string; forwarded?: boolean };
	referral?: unknown;
	errors?: unknown[];
};

export type MessageStatus = {
	id: string;
	status: string;
	timestamp: string;
	recipient_id: string;
	conversation?: { id: string; origin?: { type: string }; expiration_timestamp?: string };
	pricing?: { billable: boolean; pricing_model: string; category: string };
	errors?: { code: number; title: string; message?: string; error_data?: { details?: string } }[];
};

export type FlatIncomingMessage = {
	message_id: string;
	from: string;
	contact_name: string | null;
	timestamp: string;
	received_at: string | null;
	type: string;
	phone_number_id: string | null;
	display_phone_number: string | null;
	text: string | null;
	caption: string | null;
	media_id: string | null;
	mime_type: string | null;
	sha256: string | null;
	filename: string | null;
	latitude: number | null;
	longitude: number | null;
	location_name: string | null;
	location_address: string | null;
	interactive_type: string | null;
	interactive_reply_id: string | null;
	interactive_reply_title: string | null;
	interactive_reply_description: string | null;
	button_payload: string | null;
	button_text: string | null;
	reaction_emoji: string | null;
	reaction_message_id: string | null;
	context_message_id: string | null;
	context_from: string | null;
	forwarded: boolean;
	raw: IncomingMessage;
};

export type FlatStatus = {
	message_id: string;
	status: string;
	recipient_id: string;
	timestamp: string;
	updated_at: string | null;
	phone_number_id: string | null;
	display_phone_number: string | null;
	conversation_id: string | null;
	conversation_origin: string | null;
	conversation_expires_at: string | null;
	billable: boolean | null;
	pricing_model: string | null;
	pricing_category: string | null;
	error_code: number | null;
	error_title: string | null;
	error_message: string | null;
	error_details: string | null;
	raw: MessageStatus;
};

type MediaObject = { id: string; mime_type: string; sha256: string; caption?: string };

type WebhookBody = {
	object: string;
	entry?: { id: string; changes?: { field: string; value: Omit<ChangeValue, 'waba_id'> }[] }[];
};

type HandshakeParams = { queryParams: Record<string, string>; expectedToken?: string };
type ExtractChangesParams = { body: unknown; field: string };
type MatchPhoneParams = { value: ChangeValue; phoneNumberId?: string };
type FlattenMessageParams = { message: IncomingMessage; value: ChangeValue };
type FlattenStatusParams = { status: MessageStatus; value: ChangeValue };
