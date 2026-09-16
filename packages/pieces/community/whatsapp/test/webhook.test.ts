/// <reference types="vitest/globals" />

import { createHmac } from 'crypto';

import { ChangeValue, IncomingMessage, MessageStatus, whatsappWebhook } from '../src/lib/common/webhook';

const METADATA = { display_phone_number: '15551394669', phone_number_id: '1285944454608901' };

function wabaBody(changes: { field: string; value: Record<string, unknown> }[], entryId = 'waba-1') {
	return { object: 'whatsapp_business_account', entry: [{ id: entryId, changes }] };
}

function textMessage(overrides: Partial<IncomingMessage> = {}): IncomingMessage {
	return {
		from: '962782550213',
		id: 'wamid.TEXT',
		timestamp: '1789520000',
		type: 'text',
		text: { body: 'hello' },
		...overrides,
	};
}

function value(overrides: Partial<ChangeValue> = {}): ChangeValue {
	return {
		waba_id: 'waba-1',
		messaging_product: 'whatsapp',
		metadata: METADATA,
		contacts: [{ profile: { name: 'Odai' }, wa_id: '962782550213' }],
		...overrides,
	};
}

describe('extractChanges', () => {
	test('returns nothing for a body that is not a WhatsApp Business Account event', () => {
		expect(whatsappWebhook.extractChanges({ body: { object: 'page', entry: [] }, field: 'messages' })).toEqual([]);
		expect(whatsappWebhook.extractChanges({ body: undefined, field: 'messages' })).toEqual([]);
		expect(whatsappWebhook.extractChanges({ body: 'not json', field: 'messages' })).toEqual([]);
		expect(whatsappWebhook.extractChanges({ body: { object: 'whatsapp_business_account' }, field: 'messages' })).toEqual([]);
	});

	test('keeps only changes for the requested field and attaches the WABA id', () => {
		const body = wabaBody([
			{ field: 'messages', value: { messages: [textMessage()] } },
			{ field: 'message_template_status_update', value: { event: 'APPROVED' } },
		]);
		const messages = whatsappWebhook.extractChanges({ body, field: 'messages' });
		const templates = whatsappWebhook.extractChanges({ body, field: 'message_template_status_update' });
		expect(messages).toHaveLength(1);
		expect(messages[0].waba_id).toBe('waba-1');
		expect(messages[0].messages).toHaveLength(1);
		expect(templates).toHaveLength(1);
		expect(templates[0].event).toBe('APPROVED');
	});

	test('flattens across several entries and tolerates an entry without changes', () => {
		const body = {
			object: 'whatsapp_business_account',
			entry: [
				{ id: 'a', changes: [{ field: 'messages', value: { messages: [textMessage()] } }] },
				{ id: 'b' },
				{ id: 'c', changes: [{ field: 'messages', value: { statuses: [] } }] },
			],
		};
		const changes = whatsappWebhook.extractChanges({ body, field: 'messages' });
		expect(changes.map((change) => change.waba_id)).toEqual(['a', 'c']);
	});
});

describe('matchesPhoneNumber', () => {
	test('accepts every event when no filter is set', () => {
		expect(whatsappWebhook.matchesPhoneNumber({ value: value(), phoneNumberId: undefined })).toBe(true);
		expect(whatsappWebhook.matchesPhoneNumber({ value: value(), phoneNumberId: '' })).toBe(true);
	});

	test('filters on the metadata phone number id', () => {
		expect(whatsappWebhook.matchesPhoneNumber({ value: value(), phoneNumberId: '1285944454608901' })).toBe(true);
		expect(whatsappWebhook.matchesPhoneNumber({ value: value(), phoneNumberId: 'other' })).toBe(false);
		expect(whatsappWebhook.matchesPhoneNumber({ value: value({ metadata: undefined }), phoneNumberId: 'other' })).toBe(false);
	});
});

describe('flattenIncomingMessage', () => {
	test('text message: core fields, contact name and ISO timestamp', () => {
		const flat = whatsappWebhook.flattenIncomingMessage({ message: textMessage(), value: value() });
		expect(flat).toMatchObject({
			message_id: 'wamid.TEXT',
			from: '962782550213',
			contact_name: 'Odai',
			timestamp: '1789520000',
			received_at: '2026-09-16T00:53:20.000Z',
			type: 'text',
			phone_number_id: '1285944454608901',
			display_phone_number: '15551394669',
			text: 'hello',
			media_id: null,
			interactive_reply_id: null,
			reaction_emoji: null,
			context_message_id: null,
			forwarded: false,
		});
		expect(flat.raw).toBe(flat.raw);
	});

	test('a non-numeric or missing timestamp yields a null received_at instead of throwing', () => {
		const bad = whatsappWebhook.flattenIncomingMessage({ message: textMessage({ timestamp: 'not-a-number' }), value: value() });
		expect(bad.received_at).toBeNull();
		const empty = whatsappWebhook.flattenIncomingMessage({ message: textMessage({ timestamp: '' }), value: value() });
		expect(empty.received_at).toBeNull();
	});

	test('picks the contact matching the sender, falling back to the first contact, then null', () => {
		const twoContacts = value({
			contacts: [
				{ profile: { name: 'Someone Else' }, wa_id: '111' },
				{ profile: { name: 'Odai' }, wa_id: '962782550213' },
			],
		});
		expect(whatsappWebhook.flattenIncomingMessage({ message: textMessage(), value: twoContacts }).contact_name).toBe('Odai');
		const unrelated = value({ contacts: [{ profile: { name: 'Fallback' }, wa_id: '999' }] });
		expect(whatsappWebhook.flattenIncomingMessage({ message: textMessage(), value: unrelated }).contact_name).toBe('Fallback');
		expect(whatsappWebhook.flattenIncomingMessage({ message: textMessage(), value: value({ contacts: undefined }) }).contact_name).toBeNull();
		expect(whatsappWebhook.flattenIncomingMessage({ message: textMessage(), value: value({ metadata: undefined }) }).phone_number_id).toBeNull();
	});

	test('media messages expose the media id, mime type, hash, caption and document filename', () => {
		const image = whatsappWebhook.flattenIncomingMessage({
			message: textMessage({ type: 'image', text: undefined, image: { id: 'm1', mime_type: 'image/jpeg', sha256: 'abc', caption: 'pic' } }),
			value: value(),
		});
		expect(image).toMatchObject({ type: 'image', text: null, media_id: 'm1', mime_type: 'image/jpeg', sha256: 'abc', caption: 'pic', filename: null });

		const doc = whatsappWebhook.flattenIncomingMessage({
			message: textMessage({ type: 'document', text: undefined, document: { id: 'd1', mime_type: 'application/pdf', sha256: 'h', filename: 'invoice.pdf' } }),
			value: value(),
		});
		expect(doc).toMatchObject({ media_id: 'd1', filename: 'invoice.pdf', caption: null });
	});

	test('location, interactive replies, template buttons, reactions and reply context are flattened', () => {
		const location = whatsappWebhook.flattenIncomingMessage({
			message: textMessage({ type: 'location', text: undefined, location: { latitude: 31.95, longitude: 35.91, name: 'Amman', address: 'JO' } }),
			value: value(),
		});
		expect(location).toMatchObject({ latitude: 31.95, longitude: 35.91, location_name: 'Amman', location_address: 'JO' });

		const button = whatsappWebhook.flattenIncomingMessage({
			message: textMessage({
				type: 'interactive',
				text: undefined,
				interactive: { type: 'button_reply', button_reply: { id: 'yes', title: 'Yes' } },
				context: { from: '15551394669', id: 'wamid.ORIGINAL', forwarded: true },
			}),
			value: value(),
		});
		expect(button).toMatchObject({
			interactive_type: 'button_reply',
			interactive_reply_id: 'yes',
			interactive_reply_title: 'Yes',
			interactive_reply_description: null,
			context_message_id: 'wamid.ORIGINAL',
			context_from: '15551394669',
			forwarded: true,
		});

		const list = whatsappWebhook.flattenIncomingMessage({
			message: textMessage({ type: 'interactive', text: undefined, interactive: { type: 'list_reply', list_reply: { id: 'r1', title: 'Row', description: 'first' } } }),
			value: value(),
		});
		expect(list).toMatchObject({ interactive_reply_id: 'r1', interactive_reply_title: 'Row', interactive_reply_description: 'first' });

		const templateButton = whatsappWebhook.flattenIncomingMessage({
			message: textMessage({ type: 'button', text: undefined, button: { payload: 'STOP', text: 'Stop' } }),
			value: value(),
		});
		expect(templateButton).toMatchObject({ button_payload: 'STOP', button_text: 'Stop' });

		const reaction = whatsappWebhook.flattenIncomingMessage({
			message: textMessage({ type: 'reaction', text: undefined, reaction: { message_id: 'wamid.X', emoji: '👍' } }),
			value: value(),
		});
		expect(reaction).toMatchObject({ reaction_emoji: '👍', reaction_message_id: 'wamid.X' });

		const removed = whatsappWebhook.flattenIncomingMessage({
			message: textMessage({ type: 'reaction', text: undefined, reaction: { message_id: 'wamid.X' } }),
			value: value(),
		});
		expect(removed.reaction_emoji).toBeNull();
	});
});

describe('flattenStatus', () => {
	const delivered: MessageStatus = {
		id: 'wamid.SENT',
		status: 'delivered',
		timestamp: '1789520050',
		recipient_id: '962782550213',
		conversation: { id: 'conv', origin: { type: 'utility' }, expiration_timestamp: '1789606400' },
		pricing: { billable: true, pricing_model: 'CBP', category: 'utility' },
	};

	test('delivered status with conversation and pricing', () => {
		expect(whatsappWebhook.flattenStatus({ status: delivered, value: value() })).toEqual({
			message_id: 'wamid.SENT',
			status: 'delivered',
			recipient_id: '962782550213',
			timestamp: '1789520050',
			updated_at: '2026-09-16T00:54:10.000Z',
			phone_number_id: '1285944454608901',
			display_phone_number: '15551394669',
			conversation_id: 'conv',
			conversation_origin: 'utility',
			conversation_expires_at: '2026-09-17T00:53:20.000Z',
			billable: true,
			pricing_model: 'CBP',
			pricing_category: 'utility',
			error_code: null,
			error_title: null,
			error_message: null,
			error_details: null,
			raw: delivered,
		});
	});

	test('failed status surfaces the first error and nulls the missing conversation', () => {
		const failed: MessageStatus = {
			id: 'wamid.FAIL',
			status: 'failed',
			timestamp: 'garbage',
			recipient_id: '962782550213',
			errors: [{ code: 131026, title: 'Message undeliverable', message: 'Message undeliverable.', error_data: { details: 'Not on WhatsApp' } }],
		};
		expect(whatsappWebhook.flattenStatus({ status: failed, value: value() })).toMatchObject({
			status: 'failed',
			updated_at: null,
			conversation_id: null,
			conversation_expires_at: null,
			billable: null,
			error_code: 131026,
			error_title: 'Message undeliverable',
			error_message: 'Message undeliverable.',
			error_details: 'Not on WhatsApp',
		});
	});
});

describe('handleHandshake', () => {
	test('echoes the challenge as text/plain when no verify token is configured', () => {
		expect(
			whatsappWebhook.handleHandshake({
				queryParams: { 'hub.mode': 'subscribe', 'hub.verify_token': 'anything', 'hub.challenge': '12345' },
				expectedToken: undefined,
			}),
		).toEqual({ status: 200, body: '12345', headers: { 'Content-Type': 'text/plain' } });
	});

	test('accepts a matching token and rejects a mismatch with 403', () => {
		const good = whatsappWebhook.handleHandshake({ queryParams: { 'hub.verify_token': 'secret', 'hub.challenge': 'c' }, expectedToken: 'secret' });
		expect(good.status).toBe(200);
		expect(good.body).toBe('c');
		const bad = whatsappWebhook.handleHandshake({ queryParams: { 'hub.verify_token': 'wrong', 'hub.challenge': 'c' }, expectedToken: 'secret' });
		expect(bad.status).toBe(403);
		expect(bad.body).not.toBe('c');
		const missing = whatsappWebhook.handleHandshake({ queryParams: { 'hub.challenge': 'c' }, expectedToken: 'secret' });
		expect(missing.status).toBe(403);
	});

	test('a missing challenge still answers 200 with an empty body', () => {
		expect(whatsappWebhook.handleHandshake({ queryParams: {}, expectedToken: undefined }).body).toBe('');
	});
});

describe('delivery signature', () => {
	const raw = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
	const sign = (secret: string, body: string) => `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

	test('without an app secret every delivery is accepted, as before', () => {
		expect(whatsappWebhook.isSignedByMeta({ appSecret: undefined, headers: {}, rawBody: raw })).toBe(true);
		expect(whatsappWebhook.isSignedByMeta({ appSecret: '', headers: {}, rawBody: undefined })).toBe(true);
	});

	test('with an app secret a valid signature over the raw body is required', () => {
		expect(whatsappWebhook.isSignedByMeta({ appSecret: 's3cret', headers: { 'x-hub-signature-256': sign('s3cret', raw) }, rawBody: raw })).toBe(true);
		expect(whatsappWebhook.isSignedByMeta({ appSecret: 's3cret', headers: { 'x-hub-signature-256': sign('s3cret', raw) }, rawBody: Buffer.from(raw) })).toBe(true);
		expect(whatsappWebhook.isSignedByMeta({ appSecret: 's3cret', headers: { 'x-hub-signature-256': sign('other', raw) }, rawBody: raw })).toBe(false);
		expect(whatsappWebhook.isSignedByMeta({ appSecret: 's3cret', headers: { 'x-hub-signature-256': sign('s3cret', raw + ' ') }, rawBody: raw })).toBe(false);
	});

	test('a missing header, wrong prefix or missing raw body is rejected when a secret is set', () => {
		expect(whatsappWebhook.isSignedByMeta({ appSecret: 's3cret', headers: {}, rawBody: raw })).toBe(false);
		expect(whatsappWebhook.isSignedByMeta({ appSecret: 's3cret', headers: { 'x-hub-signature-256': 'sha1=abc' }, rawBody: raw })).toBe(false);
		expect(whatsappWebhook.isSignedByMeta({ appSecret: 's3cret', headers: { 'x-hub-signature-256': sign('s3cret', raw) }, rawBody: undefined })).toBe(false);
	});
});
