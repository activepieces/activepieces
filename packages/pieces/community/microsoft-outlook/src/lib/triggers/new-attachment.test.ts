import { describe, expect, it, vi } from 'vitest';

type FakeMessage = {
	id: string;
	receivedDateTime: string;
	from?: { emailAddress: { address?: string } };
	sender?: { emailAddress: { address?: string } };
};

const { state } = vi.hoisted(() => ({
	state: {
		messages: [] as FakeMessage[],
		attachments: {} as Record<string, { name: string; contentBytes?: string }[]>,
		requests: [] as string[],
	},
}));

vi.mock('../common/client', () => ({
	outlookCommon: {
		createClient: () => ({
			api: (url: string) => {
				state.requests.push(url);
				const request = {
					select: () => request,
					orderby: () => request,
					get: async () => {
						const attachmentMatch = url.match(/\/messages\/([^/]+)\/attachments$/);
						if (attachmentMatch) {
							return { value: state.attachments[attachmentMatch[1]] ?? [] };
						}
						return { value: state.messages };
					},
				};
				return request;
			},
		}),
		mailboxPrefix: () => '/me',
	},
}));

import { attachmentMatchesFilters, messageMatchesSender, newAttachmentTrigger } from './new-attachment';

const bytes = Buffer.from('x').toString('base64');

function message(id: string, address: string | undefined, receivedDateTime = '2026-10-05T10:00:00Z'): FakeMessage {
	return {
		id,
		receivedDateTime,
		from: address ? { emailAddress: { address } } : undefined,
		sender: address ? { emailAddress: { address } } : undefined,
	};
}

function buildContext(propsValue: Record<string, unknown>, lastPoll?: number) {
	const store = new Map<string, unknown>(lastPoll === undefined ? [] : [['lastPoll', lastPoll]]);
	return {
		auth: { access_token: 'token' },
		propsValue,
		files: { write: async ({ fileName }: { fileName: string }) => `file://${fileName}` },
		store: {
			get: async (key: string) => store.get(key),
			put: async (key: string, value: unknown) => store.set(key, value),
		},
		_store: store,
	};
}

describe('messageMatchesSender', () => {
	it('rejects a message with no sender when a sender filter is set', () => {
		expect(messageMatchesSender(message('m1', undefined) as never, 'alex@alvys.com')).toBe(false);
	});

	it('matches on from even when sender differs', () => {
		const delegated = {
			...message('m1', 'assistant@alvys.com'),
			from: { emailAddress: { address: 'Alex@Alvys.com' } },
		};
		expect(messageMatchesSender(delegated as never, 'alex@alvys.com')).toBe(true);
	});

	it('passes everything when no filter is set', () => {
		expect(messageMatchesSender(message('m1', undefined) as never, '  ')).toBe(true);
	});
});

describe('attachmentMatchesFilters', () => {
	it('accepts extensions with or without a dot, case-insensitively', () => {
		expect(attachmentMatchesFilters('Scan.PDF', { fileExtension: '.pdf' })).toBe(true);
		expect(attachmentMatchesFilters('report.docx', { fileExtension: 'pdf, docx' })).toBe(true);
		expect(attachmentMatchesFilters('logo.png', { fileExtension: 'pdf' })).toBe(false);
	});

	it('does not treat a name containing the extension as a match', () => {
		expect(attachmentMatchesFilters('pdf-guide.png', { fileExtension: 'pdf' })).toBe(false);
	});

	it('applies the name filter and the extension filter together', () => {
		expect(attachmentMatchesFilters('CamScanner 1.pdf', { attachmentNameFilter: 'camscanner', fileExtension: 'pdf' })).toBe(true);
		expect(attachmentMatchesFilters('CamScanner 1.jpg', { attachmentNameFilter: 'camscanner', fileExtension: 'pdf' })).toBe(false);
	});
});

describe('newAttachmentTrigger', () => {
	it('test only returns attachments matching every filter', async () => {
		state.messages = [message('m1', 'alex@alvys.com'), message('m2', 'someone@else.com'), message('m3', undefined)];
		state.attachments = {
			m1: [
				{ name: 'image001.png', contentBytes: bytes },
				{ name: 'CamScanner 10_4_26.pdf', contentBytes: bytes },
			],
			m2: [{ name: 'CamScanner 10_4_26.pdf', contentBytes: bytes }],
			m3: [{ name: 'CamScanner 10_4_26.pdf', contentBytes: bytes }],
		};

		const result = (await newAttachmentTrigger.test(
			buildContext({ sender: 'alex@alvys.com', attachmentNameFilter: 'CamScanner', fileExtension: 'pdf' }) as never,
		)) as Record<string, unknown>[];

		expect(result.map((item) => [item['messageId'], item['name']])).toEqual([['m1', 'CamScanner 10_4_26.pdf']]);
	});

	it('run advances lastPoll past non-matching messages so they are not rescanned', async () => {
		const lastPoll = Date.parse('2026-10-05T09:00:00Z');
		state.messages = [message('m1', 'someone@else.com', '2026-10-05T10:00:00Z')];
		state.attachments = { m1: [{ name: 'other.pdf', contentBytes: bytes }] };
		const context = buildContext({ sender: 'alex@alvys.com' }, lastPoll);

		const result = await newAttachmentTrigger.run(context as never);

		expect(result).toEqual([]);
		expect(context._store.get('lastPoll')).toBe(Date.parse('2026-10-05T10:00:00Z'));
	});
});
