import { drive_v3 } from '@googleapis/drive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newRowAddedTrigger } from '../src/lib/triggers/new-row-added-webhook';
import { newOrUpdatedRowTrigger } from '../src/lib/triggers/new-or-updated-row.trigger';
import { newSpreadsheetTrigger } from '../src/lib/triggers/new-spreadsheet';
import { engineContext, isRecord, records, rowEvents } from './support/engine-context';
import { cells, fakeGoogle, FakeTab, installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';

const CHANGE = { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content' };
type MemStore = ReturnType<typeof memoryStore>['store'];

function rowCtx<T>({ store, triggerColumn = 'all_columns' }: { store: MemStore; triggerColumn?: string }): T {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'tok', props: {}, data: {} },
			propsValue: { includeTeamDrives: false, spreadsheetId: 'ss1', sheetId: 0, trigger_column: triggerColumn },
			store,
			webhookUrl: 'https://cloud.example/v1/webhooks/flow-1',
			payload: { headers: CHANGE, body: {}, queryParams: {} },
		},
	});
}

function setSheet({ rows }: { rows: (string | number)[][] }) {
	resetFakeGoogle({ tabs: [{ sheetId: 0, title: 'Log', rows: rows.map((values) => cells({ values })) }] });
}

function tab(): FakeTab {
	return fakeGoogle.tabs[0];
}

async function nra({ store }: { store: MemStore }) {
	const out = rowEvents({ value: await newRowAddedTrigger.run(rowCtx({ store })) });
	return out.map((event) => `${event.row}:${Object.values(event.values).join('|')}`);
}

async function nuor({ store }: { store: MemStore }) {
	const out = rowEvents({ value: await newOrUpdatedRowTrigger.run(rowCtx({ store })) });
	return out.map((event) => `${event.row}:${Object.values(event.values).join('|')}`);
}

describe('QA round 2: New Row Added first-cell matching', () => {
	beforeEach(() => {
		installFakeGoogle();
		vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		vi.spyOn(console, 'info').mockImplementation(() => undefined);
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('shared status in column A: an edit plus an append with the same column A value delivers the append', async () => {
		setSheet({ rows: [['Status', 'Name'], ['open', 'Ann'], ['open', 'Bob'], ['done', 'Cat']] });
		const { store } = memoryStore();
		await newRowAddedTrigger.onEnable(rowCtx({ store }));
		tab().rows[2][1] = { value: 'Bobby' };
		tab().rows.push(cells({ values: ['open', 'Dan'] }));
		expect(await nra({ store })).toEqual(['5:open|Dan']);
	});

	it('shared date in column A: edits in several rows plus two appends deliver both appends', async () => {
		setSheet({ rows: [['Date', 'Event'], ['2026-11-09', 'a'], ['2026-11-09', 'b'], ['2026-11-09', 'c']] });
		const { store } = memoryStore();
		await newRowAddedTrigger.onEnable(rowCtx({ store }));
		tab().rows[1][1] = { value: 'a2' };
		tab().rows[3][1] = { value: 'c2' };
		tab().rows.push(cells({ values: ['2026-11-09', 'd'] }), cells({ values: ['2026-11-09', 'e'] }));
		expect(await nra({ store })).toEqual(['5:2026-11-09|d', '6:2026-11-09|e']);
	});

	it('blank column A (first filled cell is a status in B): edit plus append delivers the append', async () => {
		setSheet({ rows: [['', 'Status', 'Name'], ['', 'open', 'Ann'], ['', 'open', 'Bob']] });
		const { store } = memoryStore();
		await newRowAddedTrigger.onEnable(rowCtx({ store }));
		tab().rows[1][2] = { value: 'Anne' };
		tab().rows.push(cells({ values: ['', 'open', 'Cat'] }));
		expect(await nra({ store })).toEqual(['4:|open|Cat']);
	});

	it('insert at the top plus an edit plus an append with a shared column A delivers only the append', async () => {
		setSheet({ rows: [['Status', 'Name'], ['open', 'Ann'], ['open', 'Bob']] });
		const { store } = memoryStore();
		await newRowAddedTrigger.onEnable(rowCtx({ store }));
		tab().rows[2][1] = { value: 'Bobby' };
		tab().rows.splice(1, 0, cells({ values: ['open', 'Top'] }));
		tab().rows.push(cells({ values: ['open', 'Dan'] }));
		expect(await nra({ store })).toEqual(['5:open|Dan']);
	});

	it('sort plus an edit plus an append with a shared column A delivers only the append', async () => {
		setSheet({ rows: [['Status', 'Name'], ['open', 'Cat'], ['open', 'Ann'], ['open', 'Bob']] });
		const { store } = memoryStore();
		await newRowAddedTrigger.onEnable(rowCtx({ store }));
		const [header, cat, ann, bob] = tab().rows;
		tab().rows = [header, ann, bob, [cat[0], { value: 'Cathy' }], cells({ values: ['open', 'Dan'] })];
		expect(await nra({ store })).toEqual(['5:open|Dan']);
	});

	it('documented limitation: delete + append with the same column A in one notification is not delivered', async () => {
		setSheet({ rows: [['Status', 'Name'], ['open', 'Ann'], ['open', 'Bob'], ['done', 'Cat']] });
		const { store } = memoryStore();
		await newRowAddedTrigger.onEnable(rowCtx({ store }));
		tab().rows.splice(1, 1);
		tab().rows.push(cells({ values: ['open', 'Dan'] }));
		expect(await nra({ store })).toEqual([]);
	});

	it('NUOR is not affected by first-cell pairing: delete + append with the same column A fires the append', async () => {
		setSheet({ rows: [['Status', 'Name'], ['open', 'Ann'], ['open', 'Bob'], ['done', 'Cat']] });
		const { store } = memoryStore();
		await newOrUpdatedRowTrigger.onEnable(rowCtx({ store }));
		tab().rows.splice(1, 1);
		tab().rows.push(cells({ values: ['open', 'Dan'] }));
		expect(await nuor({ store })).toEqual(['4:open|Dan']);
	});
});

describe('QA round 2: orphan cleanup never deletes live chunks', () => {
	beforeEach(() => {
		installFakeGoogle();
		vi.spyOn(console, 'warn').mockImplementation(() => undefined);
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('shrinking from 3 chunks to 1 after a failed save keeps every live chunk and the next diffs work', async () => {
		const rows: (string | number)[][] = [['Event']];
		for (let index = 1; index <= 20_000; index++) rows.push([`evt-${index}`]);
		setSheet({ rows });
		const { store, data, failPuts } = memoryStore();
		const key = 'google-sheets-new-or-updated-row-snapshot';
		await newOrUpdatedRowTrigger.onEnable(rowCtx({ store }));
		tab().rows[5][0] = { value: 'changed' };
		failPuts.matching = new RegExp(`^${key}$`);
		await expect(newOrUpdatedRowTrigger.run(rowCtx({ store }))).rejects.toThrow(/StorageError/);
		failPuts.matching = undefined;
		tab().rows = tab().rows.slice(0, 101);
		expect(await nuor({ store })).toEqual(['6:changed']);
		const manifest = JSON.parse(data.get(key) ?? '{}');
		expect(manifest.chunkCount).toBe(1);
		const keys = [...data.keys()].filter((entry) => entry.startsWith(key)).sort();
		expect(keys).toEqual([key, `${key}_g1_0`, `${key}_g1_1`, `${key}_g1_2`, `${key}_g2_0`]);
		tab().rows[10][0] = { value: 'again' };
		expect(await nuor({ store })).toEqual(['11:again']);
		tab().rows.push(cells({ values: ['tail'] }));
		expect(await nuor({ store })).toEqual(['102:tail']);
	});
});

const SHEET = 'application/vnd.google-apps.spreadsheet';
type FakeFile = { id: string; createdTime: string; mimeType: string; driveId: string; name: string };
const drive: { files: FakeFile[]; stuck: Set<string> } = { files: [], stuck: new Set<string>() };
let clock = Date.parse('2026-11-01T10:00:00.000Z');

function addFile({ id, driveId = 'my-drive' }: { id: string; driveId?: string }) {
	clock += 60_000;
	drive.files.push({ id, name: id, mimeType: SHEET, createdTime: new Date(clock).toISOString(), driveId });
}

async function fakeFilesList(...args: unknown[]) {
	const params = listParams({ value: args[0] });
	const after = /createdTime > '([^']+)'/.exec(params.q ?? '');
	const inCorpus = (file: FakeFile) =>
		params.corpora === 'allDrives' ? true : params.corpora === 'drive' ? file.driveId === params.driveId : file.driveId === 'my-drive';
	const incomplete = (params.corpora === 'allDrives' && drive.stuck.size > 0) || (params.corpora === 'drive' && drive.stuck.has(params.driveId ?? ''));
	const files = drive.files
		.filter(inCorpus)
		.filter((file) => !(params.corpora === 'allDrives' && drive.stuck.has(file.driveId)))
		.filter((file) => !after || Date.parse(file.createdTime) > Date.parse(after[1]))
		.sort((a, b) => Date.parse(b.createdTime) - Date.parse(a.createdTime));
	return { data: { files, incompleteSearch: incomplete } };
}

function listParams({ value }: { value: unknown }): { q?: string; corpora?: string; driveId?: string } {
	if (!isRecord(value)) return {};
	return { q: optionalString({ value: value['q'] }), corpora: optionalString({ value: value['corpora'] }), driveId: optionalString({ value: value['driveId'] }) };
}

function optionalString({ value }: { value: unknown }): string | undefined {
	return typeof value === 'string' ? value : undefined;
}

async function fakeDrivesList() {
	const ids = [...new Set(drive.files.map((file) => file.driveId).filter((id) => id !== 'my-drive')), 'shared-a', 'shared-b'];
	return { data: { drives: [...new Set(ids)].map((id) => ({ id })) } };
}

function pollCtx<T>({ store, isRepublish }: { store: MemStore; isRepublish?: boolean }): T {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'tok', props: {}, data: {} },
			propsValue: { includeTeamDrives: true },
			store,
			isRepublish,
			files: { write: async () => 'unused' },
		},
	});
}

async function poll({ store }: { store: MemStore }) {
	const out = records({ value: await newSpreadsheetTrigger.run(pollCtx({ store })) });
	return out.map((file) => String(file['id'])).sort();
}

describe('QA round 2: New Spreadsheet held window', () => {
	beforeEach(() => {
		drive.files = [];
		drive.stuck = new Set();
		clock = Date.parse('2026-11-01T10:00:00.000Z');
		vi.spyOn(Date, 'now').mockImplementation(() => clock);
		vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(fakeFilesList);
		vi.spyOn(drive_v3.Resource$Drives.prototype, 'list').mockImplementation(fakeDrivesList);
		vi.spyOn(console, 'warn').mockImplementation(() => undefined);
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('upgrade from state with only lastPoll (no heldWindow key) polls normally', async () => {
		const { store, data } = memoryStore();
		await store.put('lastPoll', clock);
		addFile({ id: 'a' });
		expect(await poll({ store })).toEqual(['a']);
		expect(data.has('heldWindow')).toBe(false);
		expect(await poll({ store })).toEqual([]);
	});

	it('a stuck drive over several polls: other drives deliver once each, the backlog arrives once on recovery', async () => {
		const { store } = memoryStore();
		await newSpreadsheetTrigger.onEnable(pollCtx({ store }));
		const held = await store.get<number>('lastPoll');
		drive.stuck = new Set(['shared-a']);
		addFile({ id: 'mine-1' });
		addFile({ id: 'stuck-1', driveId: 'shared-a' });
		expect(await poll({ store })).toEqual(['mine-1']);
		addFile({ id: 'b-1', driveId: 'shared-b' });
		expect(await poll({ store })).toEqual(['b-1']);
		addFile({ id: 'stuck-2', driveId: 'shared-a' });
		addFile({ id: 'mine-2' });
		expect(await poll({ store })).toEqual(['mine-2']);
		expect(await poll({ store })).toEqual([]);
		expect(await store.get<number>('lastPoll')).toBe(held);
		drive.stuck = new Set();
		expect(await poll({ store })).toEqual(['stuck-1', 'stuck-2']);
		expect(await store.get('heldWindow')).toBeNull();
		expect(await poll({ store })).toEqual([]);
		addFile({ id: 'mine-3' });
		expect(await poll({ store })).toEqual(['mine-3']);
	});

	it('a held file that is renamed (modified) while held is not delivered again', async () => {
		const { store } = memoryStore();
		await newSpreadsheetTrigger.onEnable(pollCtx({ store }));
		drive.stuck = new Set(['shared-a']);
		addFile({ id: 'mine-1' });
		expect(await poll({ store })).toEqual(['mine-1']);
		expect(await store.get('heldWindow')).not.toBeNull();
		drive.files[0].name = 'renamed';
		expect(await poll({ store })).toEqual([]);
		drive.stuck = new Set();
		expect(await poll({ store })).toEqual([]);
	});

	it('republish keeps the held window; a fresh enable clears it', async () => {
		const { store } = memoryStore();
		await newSpreadsheetTrigger.onEnable(pollCtx({ store }));
		drive.stuck = new Set(['shared-a']);
		addFile({ id: 'mine-1' });
		expect(await poll({ store })).toEqual(['mine-1']);
		await newSpreadsheetTrigger.onDisable(pollCtx({ store, isRepublish: true }));
		await newSpreadsheetTrigger.onEnable(pollCtx({ store, isRepublish: true }));
		expect(await store.get('heldWindow')).not.toBeNull();
		expect(await poll({ store })).toEqual([]);
		await newSpreadsheetTrigger.onDisable(pollCtx({ store }));
		await newSpreadsheetTrigger.onEnable(pollCtx({ store }));
		expect(await store.get('heldWindow')).toBeNull();
		expect(await poll({ store })).toEqual([]);
	});

	it('a malformed heldWindow value is ignored rather than crashing', async () => {
		const { store } = memoryStore();
		await newSpreadsheetTrigger.onEnable(pollCtx({ store }));
		await store.put('heldWindow', 'garbage');
		addFile({ id: 'mine-1' });
		expect(await poll({ store })).toEqual(['mine-1']);
	});
});
