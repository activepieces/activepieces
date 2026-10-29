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
		attachments: {} as Record<
			string,
			{ id?: string; name: string; contentBytes?: string; '@odata.type'?: string }[]
		>,
		requests: [] as string[],
	},
}));

const PAGE_SIZE = 2;

function messagePage(messages: FakeMessage[], offset: number, order: string, pageSize = PAGE_SIZE) {
	return {
		value: messages.slice(offset, offset + pageSize),
		'@odata.nextLink':
			offset + pageSize < messages.length ? `next:${offset + pageSize}:${order}` : undefined,
	};
}

function orderedMessages(order: string): FakeMessage[] {
	if (order !== 'receivedDateTime desc') {
		return state.messages;
	}
	return [...state.messages].sort(
		(a, b) => Date.parse(b.receivedDateTime) - Date.parse(a.receivedDateTime),
	);
}

vi.mock('../common/client', () => ({
	outlookCommon: {
		createClient: () => ({
			api: (url: string) => {
				state.requests.push(url);
				let order = '';
				let pageSize = PAGE_SIZE;
				const request = {
					select: () => request,
					top: (value: number) => {
						pageSize = value;
						return request;
					},
					orderby: (value: string) => {
						order = value;
						return request;
					},
					responseType: () => request,
					get: async () => {
						if (url.endsWith('/$value')) {
							return new TextEncoder().encode('downloaded').buffer;
						}
						const attachmentMatch = url.match(/\/messages\/([^/]+)\/attachments$/);
						if (attachmentMatch) {
							return { value: state.attachments[attachmentMatch[1]] ?? [] };
						}
						const nextMatch = url.match(/^next:(\d+):(.*)$/);
						if (nextMatch) {
							return messagePage(orderedMessages(nextMatch[2]), Number(nextMatch[1]), nextMatch[2]);
						}
						return messagePage(orderedMessages(order), 0, order, pageSize);
					},
				};
				return request;
			},
		}),
		mailboxPrefix: () => '/me',
	},
}));

import {
	attachmentMatchesFilters,
	messageMatchesSender,
	newAttachmentTrigger,
} from './new-attachment';

const bytes = Buffer.from('x').toString('base64');
const FILE = '#microsoft.graph.fileAttachment';

function message(
	id: string,
	address: string | undefined,
	receivedDateTime = '2026-10-05T10:00:00Z',
): FakeMessage {
	return {
		id,
		receivedDateTime,
		from: address ? { emailAddress: { address } } : undefined,
		sender: address ? { emailAddress: { address } } : undefined,
	};
}

function buildContext(
	propsValue: Record<string, unknown>,
	initialStore: Record<string, unknown> = {},
) {
	const store = new Map<string, unknown>(Object.entries(initialStore));
	return {
		auth: { access_token: 'token' },
		propsValue,
		files: {
			write: async ({ fileName, data }: { fileName: string; data: Buffer }) =>
				`file://${fileName}#${data.toString()}`,
		},
		store: {
			get: async (key: string) => store.get(key),
			put: async (key: string, value: unknown) => store.set(key, value),
		},
		_store: store,
	};
}

describe('messageMatchesSender', () => {
	it('rejects a message with no sender when a sender filter is set', () => {
		expect(
			messageMatchesSender({
				message: message('m1', undefined) as never,
				sender: 'alex@alvys.com',
			}),
		).toBe(false);
	});

	it('matches on from even when sender differs', () => {
		const delegated = {
			...message('m1', 'assistant@alvys.com'),
			from: { emailAddress: { address: 'Alex@Alvys.com' } },
		};
		expect(messageMatchesSender({ message: delegated as never, sender: 'alex@alvys.com' })).toBe(
			true,
		);
	});

	it('passes everything when no filter is set', () => {
		expect(messageMatchesSender({ message: message('m1', undefined) as never, sender: '  ' })).toBe(
			true,
		);
	});
});

describe('attachmentMatchesFilters', () => {
	it('accepts extensions with or without a dot, case-insensitively', () => {
		expect(attachmentMatchesFilters({ name: 'Scan.PDF', filters: { fileExtension: '.pdf' } })).toBe(
			true,
		);
		expect(
			attachmentMatchesFilters({ name: 'report.docx', filters: { fileExtension: 'pdf, docx' } }),
		).toBe(true);
		expect(attachmentMatchesFilters({ name: 'logo.png', filters: { fileExtension: 'pdf' } })).toBe(
			false,
		);
	});

	it('does not treat a name containing the extension as a match', () => {
		expect(
			attachmentMatchesFilters({ name: 'pdf-guide.png', filters: { fileExtension: 'pdf' } }),
		).toBe(false);
	});

	it('applies the name filter and the extension filter together', () => {
		expect(
			attachmentMatchesFilters({
				name: 'CamScanner 1.pdf',
				filters: { attachmentNameFilter: 'camscanner', fileExtension: 'pdf' },
			}),
		).toBe(true);
		expect(
			attachmentMatchesFilters({
				name: 'CamScanner 1.jpg',
				filters: { attachmentNameFilter: 'camscanner', fileExtension: 'pdf' },
			}),
		).toBe(false);
	});
});

describe('newAttachmentTrigger', () => {
	it('test only returns attachments matching every filter', async () => {
		state.messages = [
			message('m1', 'alex@alvys.com'),
			message('m2', 'someone@else.com'),
			message('m3', undefined),
		];
		state.attachments = {
			m1: [
				{ name: 'image001.png', contentBytes: bytes, '@odata.type': FILE },
				{ name: 'CamScanner 10_4_26.pdf', contentBytes: bytes, '@odata.type': FILE },
			],
			m2: [{ name: 'CamScanner 10_4_26.pdf', contentBytes: bytes, '@odata.type': FILE }],
			m3: [{ name: 'CamScanner 10_4_26.pdf', contentBytes: bytes, '@odata.type': FILE }],
		};

		const result = (await newAttachmentTrigger.test(
			buildContext({
				sender: 'alex@alvys.com',
				attachmentNameFilter: 'CamScanner',
				fileExtension: 'pdf',
			}) as never,
		)) as Record<string, unknown>[];

		expect(result.map((item) => [item['messageId'], item['name']])).toEqual([
			['m1', 'CamScanner 10_4_26.pdf'],
		]);
	});

	it('run advances lastPoll past non-matching messages so they are not rescanned', async () => {
		const lastPoll = Date.parse('2026-10-05T09:00:00Z');
		state.messages = [message('m1', 'someone@else.com', '2026-10-05T10:00:00Z')];
		state.attachments = { m1: [{ name: 'other.pdf', contentBytes: bytes, '@odata.type': FILE }] };
		const context = buildContext(
			{ sender: 'alex@alvys.com' },
			{ pollCursor: { epochMilliSeconds: lastPoll, seenMessageIds: [] } },
		);

		const result = await newAttachmentTrigger.run(context as never);

		expect(result).toEqual([]);
		expect(context._store.get('pollCursor')).toEqual({
			epochMilliSeconds: Date.parse('2026-10-05T10:00:00Z'),
			seenMessageIds: ['m1'],
		});
	});

	it('downloads the bytes separately when Graph omits contentBytes, and skips non-file attachments', async () => {
		state.messages = [message('m1', 'alex@alvys.com')];
		state.attachments = {
			m1: [
				{ id: 'a1', name: 'CamScanner big.pdf', '@odata.type': FILE },
				{ id: 'a2', name: 'Forwarded mail.pdf', '@odata.type': '#microsoft.graph.itemAttachment' },
			],
		};
		state.requests = [];

		const result = (await newAttachmentTrigger.test(
			buildContext({ fileExtension: 'pdf' }) as never,
		)) as Record<string, unknown>[];

		expect(result.map((item) => item['file'])).toEqual(['file://CamScanner big.pdf#downloaded']);
		expect(state.requests).toContain('/me/messages/m1/attachments/a1/$value');
	});

	it('test samples the newest matches from one request of the most recent messages', async () => {
		state.requests = [];
		state.messages = [
			message('old1', 'alex@alvys.com', '2023-04-28T10:00:00Z'),
			message('old2', 'alex@alvys.com', '2023-04-29T10:00:00Z'),
			message('new1', 'alex@alvys.com', '2026-10-05T11:46:00Z'),
			message('other', 'someone@else.com', '2026-10-05T11:50:00Z'),
			message('new2', 'alex@alvys.com', '2026-10-05T11:27:00Z'),
		];
		state.attachments = Object.fromEntries(
			state.messages.map((m) => [
				m.id,
				[{ name: `${m.id}.pdf`, contentBytes: bytes, '@odata.type': FILE }],
			]),
		);

		const result = (await newAttachmentTrigger.test(
			buildContext({ sender: 'alex@alvys.com' }) as never,
		)) as Record<string, unknown>[];

		expect(result.map((item) => item['messageId'])).toEqual(['old1', 'old2', 'new2', 'new1']);
		expect(state.requests.some((url) => url.startsWith('next:'))).toBe(false);
	});

	it('run emits a matching message that shares the cursor time with an already-seen one, exactly once', async () => {
		const cursor = '2026-10-05T10:00:00Z';
		state.messages = [
			message('seen', 'someone@else.com', cursor),
			message('late', 'alex@alvys.com', cursor),
		];
		state.attachments = {
			seen: [{ name: 'other.pdf', contentBytes: bytes, '@odata.type': FILE }],
			late: [{ name: 'pod.pdf', contentBytes: bytes, '@odata.type': FILE }],
		};
		const context = buildContext(
			{ sender: 'alex@alvys.com' },
			{ pollCursor: { epochMilliSeconds: Date.parse(cursor), seenMessageIds: ['seen'] } },
		);

		const first = (await newAttachmentTrigger.run(context as never)) as Record<string, unknown>[];
		const second = await newAttachmentTrigger.run(context as never);

		expect(first.map((item) => item['messageId'])).toEqual(['late']);
		expect(second).toEqual([]);
		expect(
			state.requests.some((url) =>
				url.includes(`receivedDateTime ge ${new Date(cursor).toISOString()}`),
			),
		).toBe(true);
	});

	it('run on state saved by the old version does not replay mail at the saved time', async () => {
		const legacyLastPoll = Date.parse('2026-10-05T10:00:00Z');
		state.messages = [
			message('alreadyEmitted', 'alex@alvys.com', '2026-10-05T10:00:00Z'),
			message('new', 'alex@alvys.com', '2026-10-05T10:05:00Z'),
		];
		state.attachments = {
			alreadyEmitted: [{ name: 'old.pdf', contentBytes: bytes, '@odata.type': FILE }],
			new: [{ name: 'new.pdf', contentBytes: bytes, '@odata.type': FILE }],
		};
		const context = buildContext({ sender: 'alex@alvys.com' }, { lastPoll: legacyLastPoll });

		const result = (await newAttachmentTrigger.run(context as never)) as Record<string, unknown>[];

		expect(result.map((item) => item['messageId'])).toEqual(['new']);
		expect(context._store.get('pollCursor')).toEqual({
			epochMilliSeconds: Date.parse('2026-10-05T10:05:00Z'),
			seenMessageIds: ['new'],
		});
	});

	it('test filters on receivedDateTime first, since Graph rejects ordering by a field missing from the filter', async () => {
		state.messages = [];
		state.requests = [];

		await newAttachmentTrigger.test(buildContext({}) as never);

		expect(state.requests[0]).toMatch(/\$filter=receivedDateTime ge [^&]+ and hasAttachments eq true$/);
	});

	it('onEnable saves the cursor as one value', async () => {
		const context = buildContext({});

		await newAttachmentTrigger.onEnable(context as never);

		expect([...context._store.keys()]).toEqual(['pollCursor']);
	});

	it('onEnable on republish keeps the existing cursor', async () => {
		const existing = {
			epochMilliSeconds: Date.parse('2026-10-05T10:00:00Z'),
			seenMessageIds: ['m1'],
		};
		const context = { ...buildContext({}, { pollCursor: existing }), isRepublish: true };

		await newAttachmentTrigger.onEnable(context as never);

		expect(context._store.get('pollCursor')).toEqual(existing);
	});

	it('onEnable on republish keeps a cursor saved by the old version', async () => {
		const legacyLastPoll = Date.parse('2026-10-05T10:00:00Z');
		const context = { ...buildContext({}, { lastPoll: legacyLastPoll }), isRepublish: true };

		await newAttachmentTrigger.onEnable(context as never);

		expect([...context._store.entries()]).toEqual([['lastPoll', legacyLastPoll]]);
	});

	it('onEnable without republish resets the cursor to now', async () => {
		const context = buildContext(
			{},
			{ pollCursor: { epochMilliSeconds: 0, seenMessageIds: ['m1'] } },
		);

		await newAttachmentTrigger.onEnable(context as never);

		expect(context._store.get('pollCursor')).toEqual({
			epochMilliSeconds: expect.any(Number),
			seenMessageIds: [],
		});
		expect(
			(context._store.get('pollCursor') as { epochMilliSeconds: number }).epochMilliSeconds,
		).toBeGreaterThan(0);
	});
});
