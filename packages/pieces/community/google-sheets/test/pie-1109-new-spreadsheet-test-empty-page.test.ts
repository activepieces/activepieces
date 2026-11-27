import { drive_v3 } from '@googleapis/drive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newSpreadsheetTrigger } from '../src/lib/triggers/new-spreadsheet';
import { engineContext, isRecord, pollingTrigger, records } from './support/engine-context';
import { memoryStore } from './support/fake-google';

const trigger = pollingTrigger({ trigger: newSpreadsheetTrigger });
const SHEET = 'application/vnd.google-apps.spreadsheet';

const SHEETS = [
	{ id: 'sheet-3', name: 'Q3 budget', mimeType: SHEET, createdTime: '2026-09-30T10:00:00.000Z' },
	{ id: 'sheet-2', name: 'Q2 budget', mimeType: SHEET, createdTime: '2026-06-30T10:00:00.000Z' },
	{ id: 'sheet-1', name: 'Q1 budget', mimeType: SHEET, createdTime: '2026-03-31T10:00:00.000Z' },
];

const drive = { emptyPages: 1, calls: 0 };

async function fakeFilesList(...args: unknown[]) {
	drive.calls += 1;
	const params = isRecord(args[0]) ? args[0] : {};
	const pageToken = typeof params['pageToken'] === 'string' ? params['pageToken'] : undefined;
	const q = typeof params['q'] === 'string' ? params['q'] : '';
	const page = pageToken ? Number(pageToken.replace('page-', '')) : 1;
	if (page <= drive.emptyPages) {
		return { data: { kind: 'drive#fileList', incompleteSearch: false, files: [], nextPageToken: `page-${page + 1}` } };
	}
	const after = /createdTime > '([^']+)'/.exec(q);
	const files = SHEETS.filter((sheet) => !after || Date.parse(sheet.createdTime) > Date.parse(after[1]));
	return { data: { kind: 'drive#fileList', incompleteSearch: false, files } };
}

function ctx({ store }: { store: ReturnType<typeof memoryStore>['store'] }): Parameters<typeof trigger.run>[0] {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'token-123', props: {}, data: {} },
			propsValue: { includeTeamDrives: false },
			store,
			files: { write: async () => 'file-url' },
		},
	});
}

function ids({ value }: { value: unknown }): unknown[] {
	return records({ value }).map((file) => file['id']);
}

beforeEach(() => {
	drive.emptyPages = 1;
	drive.calls = 0;
	vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(fakeFilesList);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('PIE-1109 New Spreadsheet test() pages past empty Drive pages', () => {
	it('returns the existing spreadsheets when Drive sends an empty first page', async () => {
		const { store } = memoryStore();
		expect(ids({ value: await trigger.test(ctx({ store })) })).toEqual(['sheet-3', 'sheet-2', 'sheet-1']);
	});

	it('stops after 10 pages when every page is empty', async () => {
		drive.emptyPages = 50;
		const { store } = memoryStore();
		expect(await trigger.test(ctx({ store }))).toEqual([]);
		expect(drive.calls).toBe(10);
	});

	it('a scheduled poll over the same Drive responses follows the token and finds them', async () => {
		const { store } = memoryStore();
		await store.put('lastPoll', Date.parse('2026-01-01T00:00:00.000Z'));
		expect(ids({ value: await trigger.run(ctx({ store })) })).toEqual(['sheet-3', 'sheet-2', 'sheet-1']);
	});
});
