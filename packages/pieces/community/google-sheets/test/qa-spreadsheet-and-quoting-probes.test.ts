import { drive_v3 } from '@googleapis/drive';
import { httpClient, HttpRequest } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newSpreadsheetTrigger } from '../src/lib/triggers/new-spreadsheet';
import { googleSheetsCommon } from '../src/lib/common/common';
import { insertRowAction } from '../src/lib/actions/insert-row.action';
import { engineContext, isRecord, records } from './support/engine-context';
import { memoryStore } from './support/fake-google';

const SHEET = 'application/vnd.google-apps.spreadsheet';
let clock = Date.parse('2026-11-01T10:00:00.000Z');
const files: { id: string; createdTime: string; mimeType: string }[] = [];
const listing = { slowPageTwo: false, calls: 0 };

function ctx<T>({ store }: { store: ReturnType<typeof memoryStore>['store'] }): T {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'tok', props: {}, data: {} },
			propsValue: { includeTeamDrives: false },
			store,
			files: { write: async () => 'unused' },
		},
	});
}

function addFile({ id }: { id: string }) {
	clock += 60_000;
	files.push({ id, createdTime: new Date(clock).toISOString(), mimeType: SHEET });
}

async function fakeList(...args: unknown[]) {
	const first = args[0];
	const params = isRecord(first) ? { q: optionalString({ value: first['q'] }), pageToken: optionalString({ value: first['pageToken'] }) } : {};
	listing.calls += 1;
	const after = /createdTime > '([^']+)'/.exec(params.q ?? '');
	const matching = files
		.filter((file) => !after || Date.parse(file.createdTime) > Date.parse(after[1]))
		.sort((a, b) => Date.parse(b.createdTime) - Date.parse(a.createdTime));
	if (!params.pageToken) {
		if (listing.slowPageTwo) clock += 26_000;
		return { data: { files: matching.slice(0, 2), nextPageToken: matching.length > 2 ? 'p2' : undefined, incompleteSearch: false } };
	}
	return { data: { files: matching.slice(2), incompleteSearch: false } };
}

function optionalString({ value }: { value: unknown }): string | undefined {
	return typeof value === 'string' ? value : undefined;
}

describe('QA probe: New Spreadsheet listing deadline', () => {
	beforeEach(() => {
		files.length = 0;
		listing.slowPageTwo = false;
		listing.calls = 0;
		clock = Date.parse('2026-11-01T10:00:00.000Z');
		vi.spyOn(Date, 'now').mockImplementation(() => clock);
		vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(fakeList);
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('deadline hit mid-listing throws, keeps lastPoll, and the next poll emits every file once', async () => {
		const { store } = memoryStore();
		await newSpreadsheetTrigger.onEnable(ctx({ store }));
		const before = await store.get<number>('lastPoll');
		addFile({ id: 'a' });
		addFile({ id: 'b' });
		addFile({ id: 'c' });
		listing.slowPageTwo = true;
		await expect(newSpreadsheetTrigger.run(ctx({ store }))).rejects.toThrow(/took too long/);
		expect(await store.get<number>('lastPoll')).toBe(before);
		listing.slowPageTwo = false;
		const out = records({ value: await newSpreadsheetTrigger.run(ctx({ store })) });
		expect(out.map((file) => String(file['id'])).sort()).toEqual(['a', 'b', 'c']);
		expect(await newSpreadsheetTrigger.run(ctx({ store }))).toEqual([]);
	});
});

describe('QA probe: A1 quoting', () => {
	it.each(['Sheet1', 'Orders', 'Log', 'My_Sheet', 'ABCD1', 'Leads2024', 'A', 'Data'])('plain title %s stays bare', (title) => {
		expect(googleSheetsCommon.sheetRange({ sheetName: title, range: 'A:A' })).toBe(`${title}!A:A`);
		expect(googleSheetsCommon.sheetRange({ sheetName: title })).toBe(title);
	});

	it.each([
		['Q1', "'Q1'"],
		['FY24', "'FY24'"],
		['ABC123', "'ABC123'"],
		['R1C1', "'R1C1'"],
		['rc', "'rc'"],
		["It's", "'It''s'"],
		['My Sheet', "'My Sheet'"],
		['A!B', "'A!B'"],
	])('title %s is quoted as %s', (title, quoted) => {
		expect(googleSheetsCommon.sheetRange({ sheetName: title, range: 'A1' })).toBe(`${quoted}!A1`);
	});

	it.each([
		['Sheet1', 'Sheet1!A:A'],
		['Q1', "'Q1'!A:A"],
	])('Insert Row appends to %s with range %s', async (title, expected) => {
		const urls: string[] = [];
		const bodies: unknown[] = [];
		vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
			if (request.url.endsWith('/ss1')) {
				return { status: 200, headers: {}, body: { sheets: [{ properties: { title, sheetId: 5 } }] } };
			}
			urls.push(request.url);
			bodies.push(request.body);
			return { status: 200, headers: {}, body: { updates: { updatedRange: `${title}!A7:B7` } } };
		});
		await insertRowAction.run(
			engineContext({
				context: {
					auth: { type: 'OAUTH2', access_token: 'tok', props: {}, data: {} },
					propsValue: { spreadsheetId: 'ss1', sheetId: 5, first_row_headers: false, as_string: false, values: { values: ['x'] }, includeTeamDrives: false },
					store: memoryStore().store,
				},
			}),
		);
		expect(urls[0]).toContain(`/values/${encodeURIComponent(expected)}:append`);
		expect(records({ value: bodies })[0]['range']).toBe(expected);
		vi.restoreAllMocks();
	});
});
