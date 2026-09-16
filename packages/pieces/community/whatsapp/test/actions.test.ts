/// <reference types="vitest/globals" />

import { httpClient, HttpMethod, HttpRequest, HttpResponse } from '@activepieces/pieces-common';
import { createMockActionContext } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { sendInteractiveButtons } from '../src/lib/actions/send-interactive-buttons';
import { sendInteractiveList } from '../src/lib/actions/send-interactive-list';
import { sendInteractiveCtaUrl } from '../src/lib/actions/send-interactive-cta-url';
import { sendLocation } from '../src/lib/actions/send-location';
import { sendContact } from '../src/lib/actions/send-contact';
import { sendReaction } from '../src/lib/actions/send-reaction';
import { markMessageAsRead } from '../src/lib/actions/mark-message-as-read';
import { uploadMedia } from '../src/lib/actions/upload-media';
import { createMessageTemplate } from '../src/lib/actions/create-message-template';
import { deleteMessageTemplate } from '../src/lib/actions/delete-message-template';
import { updateBusinessProfile } from '../src/lib/actions/update-business-profile';
import { getBusinessProfile } from '../src/lib/actions/get-business-profile';
import { listMessageTemplates } from '../src/lib/actions/list-message-templates';
import { sendMessage } from '../src/lib/actions/send-message';
import { sendMedia } from '../src/lib/actions/send-media';
import { sendTemplate } from '../src/lib/actions/send-template';

const AUTH = { type: 'CUSTOM_AUTH', props: { access_token: 'tok', businessAccountId: 'WABA' } };
const SEND_RESPONSE = { messaging_product: 'whatsapp', contacts: [{ input: '1', wa_id: '1' }], messages: [{ id: 'wamid.NEW' }] };
const BASE = { phone_number_id: 'PN', to: '962782550213' };

const requests: HttpRequest[] = [];

function context<T extends Record<string, unknown>>(propsValue: T) {
	return { ...createMockActionContext({ propsValue }), auth: AUTH };
}

function respondWith(...bodies: unknown[]) {
	let call = 0;
	vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest): Promise<HttpResponse> => {
		requests.push(request);
		const body = bodies[Math.min(call, bodies.length - 1)];
		call += 1;
		return { status: 200, headers: {}, body };
	});
}

beforeEach(() => {
	requests.length = 0;
	respondWith(SEND_RESPONSE);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('send actions return the bare API payload', () => {
	test('Send Message posts a text payload and returns response.body, not the HTTP envelope', async () => {
		const out = await sendMessage.run(context({ ...BASE, text: 'hello' }));
		expect(out).toEqual(SEND_RESPONSE);
		expect(out).not.toHaveProperty('status');
		expect(requests[0].url).toBe('https://graph.facebook.com/v23.0/PN/messages');
		expect(requests[0].body).toEqual({ messaging_product: 'whatsapp', recipient_type: 'individual', to: '962782550213', type: 'text', text: { body: 'hello' } });
	});

	test('Send Media only attaches caption where the type allows it, and filename only for documents', async () => {
		await sendMedia.run(context({ ...BASE, type: 'audio', media: 'https://x/a.mp3', caption: 'ignored', filename: 'ignored' }));
		expect(requests[0].body).toMatchObject({ type: 'audio', audio: { link: 'https://x/a.mp3' } });
		expect(requests[0].body).not.toMatchObject({ audio: { caption: 'ignored' } });

		await sendMedia.run(context({ ...BASE, type: 'document', media: 'https://x/a.pdf', caption: 'see attached', filename: 'a.pdf' }));
		expect(requests[1].body).toMatchObject({ type: 'document', document: { link: 'https://x/a.pdf', caption: 'see attached', filename: 'a.pdf' } });

		await sendMedia.run(context({ ...BASE, type: 'image', media: 'https://x/a.png', filename: 'nope.png' }));
		expect(requests[2].body).toMatchObject({ image: { link: 'https://x/a.png' } });
		expect(requests[2].body).not.toMatchObject({ image: { filename: 'nope.png' } });
	});
});

describe('Send Template (agent twin)', () => {
	test('sends name + language only when there are no parameters', async () => {
		await sendTemplate.run(context({ ...BASE, template_name: 'hello_world', language_code: 'en_US' }));
		expect(requests[0].body).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '962782550213',
			type: 'template',
			template: { name: 'hello_world', language: { code: 'en_US' } },
		});
	});

	test('builds header, body and url-button components from positional lists, accepting JSON strings', async () => {
		await sendTemplate.run(
			context({
				...BASE,
				template_name: 'order_update',
				language_code: 'en_US',
				header_parameters: ['Sam'],
				body_parameters: '["A1","tomorrow"]',
				button_url_parameters: ['track/A1', ''],
				reply_to_message_id: 'wamid.R',
			}),
		);
		expect(requests[0].body).toMatchObject({
			context: { message_id: 'wamid.R' },
			template: {
				name: 'order_update',
				language: { code: 'en_US' },
				components: [
					{ type: 'header', parameters: [{ type: 'text', text: 'Sam' }] },
					{ type: 'body', parameters: [{ type: 'text', text: 'A1' }, { type: 'text', text: 'tomorrow' }] },
					{ type: 'button', sub_type: 'url', index: 0, parameters: [{ type: 'text', text: 'track/A1' }] },
				],
			},
		});
	});
});

describe('Send Interactive Buttons', () => {
	const buttons = [{ id: 'yes', title: 'Yes' }, { id: 'no', title: 'No' }];

	test('happy path builds the interactive button payload with optional header and footer', async () => {
		const out = await sendInteractiveButtons.run(
			context({ ...BASE, body: 'Pick', buttons, header_type: 'text', header_text: 'Head', footer: 'Foot', reply_to_message_id: 'wamid.R' }),
		);
		expect(out).toEqual(SEND_RESPONSE);
		expect(requests[0].body).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '962782550213',
			context: { message_id: 'wamid.R' },
			type: 'interactive',
			interactive: {
				type: 'button',
				header: { type: 'text', text: 'Head' },
				body: { text: 'Pick' },
				footer: { text: 'Foot' },
				action: { buttons: [{ type: 'reply', reply: { id: 'yes', title: 'Yes' } }, { type: 'reply', reply: { id: 'no', title: 'No' } }] },
			},
		});
	});

	test('omits header and footer when not provided and accepts the array as a JSON string', async () => {
		await sendInteractiveButtons.run(context({ ...BASE, body: 'Pick', buttons: JSON.stringify(buttons), header_type: 'none' }));
		const interactive = (requests[0].body as { interactive: Record<string, unknown> }).interactive;
		expect(interactive).not.toHaveProperty('header');
		expect(interactive).not.toHaveProperty('footer');
		expect(interactive.action).toEqual({ buttons: [{ type: 'reply', reply: { id: 'yes', title: 'Yes' } }, { type: 'reply', reply: { id: 'no', title: 'No' } }] });
	});

	test('rejects zero or more than three buttons before calling the API', async () => {
		await expect(sendInteractiveButtons.run(context({ ...BASE, body: 'x', buttons: [] }))).rejects.toThrow('between 1 and 3');
		await expect(
			sendInteractiveButtons.run(context({ ...BASE, body: 'x', buttons: [1, 2, 3, 4].map((n) => ({ id: `${n}`, title: `T${n}` })) })),
		).rejects.toThrow('between 1 and 3');
		expect(requests).toHaveLength(0);
	});

	test('rejects duplicate titles, duplicate ids, missing ids, over-long titles and over-long body', async () => {
		await expect(sendInteractiveButtons.run(context({ ...BASE, body: 'x', buttons: [{ id: 'a', title: 'Same' }, { id: 'b', title: 'Same' }] }))).rejects.toThrow(
			'Button titles must be unique.',
		);
		await expect(sendInteractiveButtons.run(context({ ...BASE, body: 'x', buttons: [{ id: 'a', title: 'One' }, { id: 'a', title: 'Two' }] }))).rejects.toThrow(
			'Button IDs must be unique.',
		);
		await expect(sendInteractiveButtons.run(context({ ...BASE, body: 'x', buttons: [{ title: 'No id' }] }))).rejects.toThrow('Button ID is required');
		await expect(sendInteractiveButtons.run(context({ ...BASE, body: 'x', buttons: [{ id: 'a', title: 'x'.repeat(21) }] }))).rejects.toThrow(
			'Button title must be at most 20 characters (got 21).',
		);
		await expect(sendInteractiveButtons.run(context({ ...BASE, body: 'x'.repeat(1025), buttons }))).rejects.toThrow('Body must be at most 1024');
		await expect(sendInteractiveButtons.run(context({ ...BASE, body: 'ok', buttons, footer: 'f'.repeat(61) }))).rejects.toThrow('Footer must be at most 60');
		expect(requests).toHaveLength(0);
	});
});

describe('Send Interactive List', () => {
	const rows = [{ id: 'r1', title: 'Row one', description: 'first' }, { id: 'r2', title: 'Row two' }];
	const base = { ...BASE, body: 'Choose', button_text: 'Open', section_title: 'Options', rows };

	test('happy path builds one section with rows and drops empty descriptions', async () => {
		await sendInteractiveList.run(context({ ...base, header_text: 'Menu' }));
		expect(requests[0].body).toMatchObject({
			type: 'interactive',
			interactive: {
				type: 'list',
				header: { type: 'text', text: 'Menu' },
				body: { text: 'Choose' },
				action: { button: 'Open', sections: [{ title: 'Options', rows: [{ id: 'r1', title: 'Row one', description: 'first' }, { id: 'r2', title: 'Row two' }] }] },
			},
		});
		const secondRow = (requests[0].body as { interactive: { action: { sections: { rows: Record<string, unknown>[] }[] } } }).interactive.action.sections[0].rows[1];
		expect(secondRow).not.toHaveProperty('description');
	});

	test('enforces Meta limits: 1–10 rows, unique ids, 24-char titles, 72-char descriptions, 20-char button, 4096-char body', async () => {
		await expect(sendInteractiveList.run(context({ ...base, rows: [] }))).rejects.toThrow('between 1 and 10');
		await expect(sendInteractiveList.run(context({ ...base, rows: Array.from({ length: 11 }, (_, i) => ({ id: `${i}`, title: `T${i}` })) }))).rejects.toThrow(
			'between 1 and 10',
		);
		await expect(sendInteractiveList.run(context({ ...base, rows: [{ id: 'dup', title: 'A' }, { id: 'dup', title: 'B' }] }))).rejects.toThrow('Row IDs must be unique.');
		await expect(sendInteractiveList.run(context({ ...base, rows: [{ id: 'a', title: 't'.repeat(25) }] }))).rejects.toThrow('Row title must be at most 24');
		await expect(sendInteractiveList.run(context({ ...base, rows: [{ id: 'a', title: 'ok', description: 'd'.repeat(73) }] }))).rejects.toThrow(
			'Row description must be at most 72',
		);
		await expect(sendInteractiveList.run(context({ ...base, button_text: 'b'.repeat(21) }))).rejects.toThrow('Button text must be at most 20');
		await expect(sendInteractiveList.run(context({ ...base, section_title: 's'.repeat(25) }))).rejects.toThrow('Section title must be at most 24');
		await expect(sendInteractiveList.run(context({ ...base, body: 'b'.repeat(4097) }))).rejects.toThrow('Body must be at most 4096');
		expect(requests).toHaveLength(0);
	});
});

describe('Send Interactive CTA URL', () => {
	test('builds the cta_url action with an image header', async () => {
		await sendInteractiveCtaUrl.run(
			context({ ...BASE, body: 'Visit', button_text: 'Open', url: 'https://activepieces.com', header_type: 'image', header_media_url: 'https://x/i.png' }),
		);
		expect(requests[0].body).toMatchObject({
			interactive: {
				type: 'cta_url',
				header: { type: 'image', image: { link: 'https://x/i.png' } },
				body: { text: 'Visit' },
				action: { name: 'cta_url', parameters: { display_text: 'Open', url: 'https://activepieces.com' } },
			},
		});
	});

	test('rejects an over-long button label', async () => {
		await expect(sendInteractiveCtaUrl.run(context({ ...BASE, body: 'x', button_text: 'l'.repeat(21), url: 'https://a' }))).rejects.toThrow('Button text must be at most 20');
		expect(requests).toHaveLength(0);
	});
});

describe('Send Location', () => {
	test('sends coordinates as strings and omits empty name/address', async () => {
		await sendLocation.run(context({ ...BASE, latitude: 31.9539, longitude: 35.9106 }));
		expect(requests[0].body).toMatchObject({ type: 'location', location: { latitude: '31.9539', longitude: '35.9106' } });
		expect((requests[0].body as { location: Record<string, unknown> }).location).not.toHaveProperty('name');
		await sendLocation.run(context({ ...BASE, latitude: 0, longitude: -0.5, name: 'Null Island', address: 'Ocean' }));
		expect(requests[1].body).toMatchObject({ location: { latitude: '0', longitude: '-0.5', name: 'Null Island', address: 'Ocean' } });
	});
});

describe('Send Contact', () => {
	test('includes only the provided sections and requires a phone on each phone entry', async () => {
		await sendContact.run(context({ ...BASE, formatted_name: 'Jane Doe' }));
		expect(requests[0].body).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '962782550213',
			type: 'contacts',
			contacts: [{ name: { formatted_name: 'Jane Doe' } }],
		});

		await sendContact.run(
			context({
				...BASE,
				formatted_name: 'Jane Doe',
				first_name: 'Jane',
				phones: [{ phone: '+15551234567', type: 'WORK' }, { phone: '+15557654321' }],
				emails: '[{"email":"jane@example.com","type":"WORK"}]',
				company: 'Acme',
				website: 'https://acme.test',
			}),
		);
		expect(requests[1].body).toMatchObject({
			contacts: [
				{
					name: { formatted_name: 'Jane Doe', first_name: 'Jane' },
					phones: [{ phone: '+15551234567', type: 'WORK' }, { phone: '+15557654321' }],
					emails: [{ email: 'jane@example.com', type: 'WORK' }],
					org: { company: 'Acme' },
					urls: [{ url: 'https://acme.test', type: 'WORK' }],
				},
			],
		});

		await expect(sendContact.run(context({ ...BASE, formatted_name: 'X', phones: [{ type: 'WORK' }] }))).rejects.toThrow('Phone is required');
	});
});

describe('Send Reaction and Mark As Read', () => {
	test('an empty emoji removes the reaction', async () => {
		await sendReaction.run(context({ ...BASE, message_id: 'wamid.T', emoji: '👍' }));
		expect(requests[0].body).toMatchObject({ type: 'reaction', reaction: { message_id: 'wamid.T', emoji: '👍' } });
		await sendReaction.run(context({ ...BASE, message_id: 'wamid.T', emoji: undefined }));
		expect(requests[1].body).toMatchObject({ reaction: { message_id: 'wamid.T', emoji: '' } });
	});

	test('mark as read sends status=read and adds the typing indicator only when asked', async () => {
		respondWith({ success: true });
		const out = await markMessageAsRead.run(context({ phone_number_id: 'PN', message_id: 'wamid.IN', show_typing_indicator: false }));
		expect(out).toEqual({ success: true });
		expect(requests[0].url).toBe('https://graph.facebook.com/v23.0/PN/messages');
		expect(requests[0].body).toEqual({ messaging_product: 'whatsapp', status: 'read', message_id: 'wamid.IN' });
		await markMessageAsRead.run(context({ phone_number_id: 'PN', message_id: 'wamid.IN', show_typing_indicator: true }));
		expect(requests[1].body).toMatchObject({ typing_indicator: { type: 'text' } });
	});
});

describe('Upload Media', () => {
	test('posts multipart form-data with messaging_product, type and the file', async () => {
		respondWith({ id: 'media-1' });
		const out = await uploadMedia.run(
			context({ phone_number_id: 'PN', file: { filename: 'logo.png', data: Buffer.from('png-bytes'), extension: 'png' }, mime_type: 'image/png' }),
		);
		expect(out).toEqual({ id: 'media-1' });
		expect(requests[0].url).toBe('https://graph.facebook.com/v23.0/PN/media');
		expect(requests[0].body).toBeInstanceOf(FormData);
		expect(String(requests[0].headers?.['content-type'])).toMatch(/^multipart\/form-data; boundary=/);
		const serialized = (requests[0].body as FormData).getBuffer().toString();
		expect(serialized).toContain('name="messaging_product"');
		expect(serialized).toContain('whatsapp');
		expect(serialized).toContain('name="type"');
		expect(serialized).toContain('image/png');
		expect(serialized).toContain('filename="logo.png"');
		expect(serialized).toContain('png-bytes');
	});
});

describe('Templates', () => {
	test('create converts [[n]] markers and posts to the WABA', async () => {
		respondWith({ id: 't1', status: 'PENDING', category: 'UTILITY' });
		const out = await createMessageTemplate.run(
			context({ name: 'order_update', language: 'en_US', category: 'UTILITY', components: [{ type: 'BODY', text: 'Order [[1]] shipped.', example: { body_text: [['A1']] } }] }),
		);
		expect(out).toEqual({ id: 't1', status: 'PENDING', category: 'UTILITY' });
		expect(requests[0].url).toBe('https://graph.facebook.com/v23.0/WABA/message_templates');
		expect(requests[0].body).toEqual({
			name: 'order_update',
			language: 'en_US',
			category: 'UTILITY',
			components: [{ type: 'BODY', text: 'Order {{1}} shipped.', example: { body_text: [['A1']] } }],
		});
	});

	test('delete resolves the template name first, then deletes by hsm_id and name', async () => {
		respondWith({ id: 't1', name: 'order_update' }, { success: true });
		const out = await deleteMessageTemplate.run(context({ message_template_id: 't1' }));
		expect(out).toEqual({ success: true });
		expect(requests[0]).toMatchObject({ method: HttpMethod.GET, url: 'https://graph.facebook.com/v23.0/t1', queryParams: { fields: 'id,name' } });
		expect(requests[1]).toMatchObject({
			method: HttpMethod.DELETE,
			url: 'https://graph.facebook.com/v23.0/WABA/message_templates',
			queryParams: { hsm_id: 't1', name: 'order_update' },
		});
	});

	test('list passes the status filter only when set and returns a count', async () => {
		respondWith({ data: [{ id: 'a' }, { id: 'b' }] });
		const out = await listMessageTemplates.run(context({ status: undefined, limit: undefined }));
		expect(out).toEqual({ templates: [{ id: 'a' }, { id: 'b' }], count: 2 });
		expect(requests[0].queryParams).toEqual({ fields: 'id,name,language,category,status,components,quality_score', limit: '100' });
		await listMessageTemplates.run(context({ status: 'APPROVED', limit: 5 }));
		expect(requests[1].queryParams).toMatchObject({ status: 'APPROVED', limit: '5' });
	});
});

describe('Business profile', () => {
	test('get unwraps data[0]; update sends only filled fields plus messaging_product', async () => {
		respondWith({ data: [{ messaging_product: 'whatsapp', vertical: 'OTHER' }] });
		expect(await getBusinessProfile.run(context({ phone_number_id: 'PN' }))).toEqual({ messaging_product: 'whatsapp', vertical: 'OTHER' });
		expect(requests[0].url).toBe('https://graph.facebook.com/v23.0/PN/whatsapp_business_profile');

		respondWith({ success: true });
		await updateBusinessProfile.run(context({ phone_number_id: 'PN', about: 'Hi', address: '', email: undefined, websites: ['https://a.test', ''], vertical: undefined }));
		expect(requests[1].body).toEqual({ messaging_product: 'whatsapp', about: 'Hi', websites: ['https://a.test'] });
	});
});
