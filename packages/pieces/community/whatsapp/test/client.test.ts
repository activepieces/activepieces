/// <reference types="vitest/globals" />

import { httpClient, HttpMethod, HttpRequest, HttpResponse } from '@activepieces/pieces-common';
import { whatsappClient } from '../src/lib/common/client';
import { WHATSAPP_API_BASE } from '../src/lib/common/utils';

let lastRequest: HttpRequest | undefined;

beforeEach(() => {
	lastRequest = undefined;
	vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest): Promise<HttpResponse> => {
		lastRequest = request;
		return { status: 200, headers: {}, body: { ok: true } };
	});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('WHATSAPP_API_BASE', () => {
	test('pins a single, current Graph API version for the whole piece', () => {
		expect(WHATSAPP_API_BASE).toBe('https://graph.facebook.com/v23.0');
	});
});

describe('request', () => {
	test('builds the URL from the base, sends a bearer token and returns only the body', async () => {
		const body = await whatsappClient.request({ accessToken: 'tok', method: HttpMethod.GET, path: '/123', queryParams: { fields: 'id' } });
		expect(body).toEqual({ ok: true });
		expect(lastRequest?.url).toBe('https://graph.facebook.com/v23.0/123');
		expect(lastRequest?.authentication).toEqual({ type: 'BEARER_TOKEN', token: 'tok' });
		expect(lastRequest?.queryParams).toEqual({ fields: 'id' });
	});
});

describe('sendMessage', () => {
	test('posts to /{phone}/messages with the WhatsApp envelope and the payload merged in', async () => {
		await whatsappClient.sendMessage({
			accessToken: 'tok',
			phoneNumberId: 'PN',
			to: '962782550213',
			payload: { type: 'text', text: { body: 'hi' } },
		});
		expect(lastRequest?.method).toBe(HttpMethod.POST);
		expect(lastRequest?.url).toBe('https://graph.facebook.com/v23.0/PN/messages');
		expect(lastRequest?.body).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '962782550213',
			type: 'text',
			text: { body: 'hi' },
		});
	});

	test('adds a context.message_id only when replying to a message', async () => {
		await whatsappClient.sendMessage({ accessToken: 't', phoneNumberId: 'PN', to: '1', replyToMessageId: 'wamid.X', payload: { type: 'text' } });
		expect(lastRequest?.body).toMatchObject({ context: { message_id: 'wamid.X' } });
		await whatsappClient.sendMessage({ accessToken: 't', phoneNumberId: 'PN', to: '1', replyToMessageId: '', payload: { type: 'text' } });
		expect(lastRequest?.body).not.toHaveProperty('context');
	});
});

describe('buildInteractiveHeader', () => {
	test('none or missing type yields no header', () => {
		expect(whatsappClient.buildInteractiveHeader({ headerType: 'none', headerText: 'x' })).toBeUndefined();
		expect(whatsappClient.buildInteractiveHeader({ headerType: undefined, headerText: 'x' })).toBeUndefined();
	});

	test('text header needs text; media header needs a URL', () => {
		expect(whatsappClient.buildInteractiveHeader({ headerType: 'text', headerText: 'Hello' })).toEqual({ type: 'text', text: 'Hello' });
		expect(whatsappClient.buildInteractiveHeader({ headerType: 'text', headerText: '' })).toBeUndefined();
		expect(whatsappClient.buildInteractiveHeader({ headerType: 'image', headerMediaUrl: 'https://x/y.png' })).toEqual({
			type: 'image',
			image: { link: 'https://x/y.png' },
		});
		expect(whatsappClient.buildInteractiveHeader({ headerType: 'video', headerMediaUrl: '' })).toBeUndefined();
		expect(whatsappClient.buildInteractiveHeader({ headerType: 'document', headerMediaUrl: 'https://x/a.pdf' })).toEqual({
			type: 'document',
			document: { link: 'https://x/a.pdf' },
		});
	});
});

describe('normalizeTemplateComponents', () => {
	test('converts [[n]] and [[name]] markers to WhatsApp double braces at any depth', () => {
		const input = [
			{ type: 'HEADER', format: 'TEXT', text: 'Hi [[1]]' },
			{ type: 'BODY', text: 'Order [[order_id]] ships [[2]].', example: { body_text: [['A1', 'today']] } },
			{ type: 'BUTTONS', buttons: [{ type: 'URL', text: 'Track', url: 'https://x/[[1]]' }] },
		];
		expect(whatsappClient.normalizeTemplateComponents(input)).toEqual([
			{ type: 'HEADER', format: 'TEXT', text: 'Hi {{1}}' },
			{ type: 'BODY', text: 'Order {{order_id}} ships {{2}}.', example: { body_text: [['A1', 'today']] } },
			{ type: 'BUTTONS', buttons: [{ type: 'URL', text: 'Track', url: 'https://x/{{1}}' }] },
		]);
	});

	test('leaves numbers, booleans, null and unrelated brackets untouched and does not mutate the input', () => {
		const input = { n: 1, b: true, z: null, s: 'a [b] [[c d]] [[ok]]' };
		const out = whatsappClient.normalizeTemplateComponents(input);
		expect(out).toEqual({ n: 1, b: true, z: null, s: 'a [b] [[c d]] {{ok}}' });
		expect(input.s).toBe('a [b] [[c d]] [[ok]]');
		expect(whatsappClient.normalizeTemplateComponents('plain')).toBe('plain');
		expect(whatsappClient.normalizeTemplateComponents(undefined)).toBeUndefined();
	});
});
