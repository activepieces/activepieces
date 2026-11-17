import { drive_v3 } from '@googleapis/drive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newSpreadsheetTrigger } from '../src/lib/triggers/new-spreadsheet';
import { engineContext, isRecord, pollingTrigger, records } from './support/engine-context';
import { memoryStore } from './support/fake-google';

const trigger = pollingTrigger({ trigger: newSpreadsheetTrigger });

const SHEET = 'application/vnd.google-apps.spreadsheet';

type FakeFile = { id: string; name: string; mimeType: string; createdTime: string; driveId: string };
type ListParams = { q?: string; corpora?: string; driveId?: string };
type FakeDrive = { files: FakeFile[]; unsearched: Set<string>; stillIncomplete: Set<string>; failing: Set<string>; hanging: Set<string>; corpora: (string | undefined)[]; hang: boolean };

const drive: FakeDrive = {
	files: [],
	unsearched: new Set<string>(),
	stillIncomplete: new Set<string>(),
	failing: new Set<string>(),
	hanging: new Set<string>(),
	corpora: [],
	hang: false,
};

let clock = Date.parse('2026-11-01T10:00:00.000Z');

function addFile({ id, driveId = 'my-drive' }: { id: string; driveId?: string }) {
	clock += 60_000;
	drive.files.push({ id, name: id, mimeType: SHEET, createdTime: new Date(clock).toISOString(), driveId });
}

function inCorpus({ params, file }: { params: ListParams; file: FakeFile }): boolean {
	if (params.corpora === 'allDrives') return true;
	if (params.corpora === 'drive') return file.driveId === params.driveId;
	return file.driveId === 'my-drive';
}

async function fakeFilesList(...args: unknown[]) {
	const params = listParams({ value: args[0] });
	drive.corpora.push(params.corpora);
	if (drive.hang) return new Promise(() => undefined);
	if (params.corpora === 'drive' && drive.hanging.has(params.driveId ?? '')) return new Promise(() => undefined);
	if (params.corpora === 'drive' && drive.failing.has(params.driveId ?? '')) {
		throw Object.assign(new Error('Internal Error'), { code: 500 });
	}
	const after = /createdTime > '([^']+)'/.exec(params.q ?? '');
	const incomplete =
		(params.corpora === 'allDrives' && drive.unsearched.size > 0) ||
		(params.corpora === 'drive' && drive.stillIncomplete.has(params.driveId ?? ''));
	const files = drive.files
		.filter((file) => inCorpus({ params, file }))
		.filter((file) => !(params.corpora === 'allDrives' && drive.unsearched.has(file.driveId)))
		.filter((file) => !after || Date.parse(file.createdTime) > Date.parse(after[1]))
		.sort((a, b) => Date.parse(b.createdTime) - Date.parse(a.createdTime));
	return { data: { files, incompleteSearch: incomplete } };
}

function listParams({ value }: { value: unknown }): ListParams {
	if (!isRecord(value)) return {};
	return { q: optionalString({ value: value['q'] }), corpora: optionalString({ value: value['corpora'] }), driveId: optionalString({ value: value['driveId'] }) };
}

function optionalString({ value }: { value: unknown }): string | undefined {
	return typeof value === 'string' ? value : undefined;
}

async function fakeDrivesList() {
	const ids = [...new Set(drive.files.map((file) => file.driveId).filter((id) => id !== 'my-drive'))];
	return { data: { drives: ids.map((id) => ({ id })) } };
}

function ctx({ store, includeTeamDrives }: { store: ReturnType<typeof memoryStore>['store']; includeTeamDrives: boolean }): Parameters<typeof trigger.run>[0] {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'tok', props: {}, data: {} },
			propsValue: { includeTeamDrives },
			store,
			files: { write: async () => 'unused' },
		},
	});
}

async function poll({ store, includeTeamDrives = true }: { store: ReturnType<typeof memoryStore>['store']; includeTeamDrives?: boolean }) {
	const out = records({ value: await trigger.run(ctx({ store, includeTeamDrives })) });
	return out.map((file) => file['id']);
}

beforeEach(() => {
	drive.files = [];
	drive.unsearched = new Set();
	drive.stillIncomplete = new Set();
	drive.failing = new Set();
	drive.hanging = new Set();
	drive.corpora = [];
	drive.hang = false;
	clock = Date.parse('2026-11-01T10:00:00.000Z');
	vi.spyOn(Date, 'now').mockImplementation(() => clock);
	vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(fakeFilesList);
	vi.spyOn(drive_v3.Resource$Drives.prototype, 'list').mockImplementation(fakeDrivesList);
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('New Spreadsheet behaviour', () => {
	it('fires once per new spreadsheet and never for files that existed at enable', async () => {
		addFile({ id: 'old' });
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store, includeTeamDrives: true }));
		expect(await poll({ store })).toEqual([]);
		addFile({ id: 'new-1' });
		expect(await poll({ store })).toEqual(['new-1']);
		expect(await poll({ store })).toEqual([]);
	});

	it('falls back to per-drive listing when the all-drives search is incomplete', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store, includeTeamDrives: true }));
		addFile({ id: 'shared-file', driveId: 'shared-legal' });
		addFile({ id: 'mine' });
		drive.unsearched = new Set(['shared-legal']);
		expect(await poll({ store })).toEqual(['mine', 'shared-file']);
		drive.unsearched = new Set();
		expect(await poll({ store })).toEqual([]);
		expect(drive.corpora).toContain('drive');
	});

	it('keeps delivering other drives while one shared drive stays incomplete, then delivers its files once', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store, includeTeamDrives: true }));
		const before = await store.get<number>('lastPoll');
		addFile({ id: 'shared-file', driveId: 'shared-legal' });
		addFile({ id: 'mine-1' });
		drive.unsearched = new Set(['shared-legal']);
		drive.stillIncomplete = new Set(['shared-legal']);
		expect(await poll({ store })).toEqual(['mine-1']);
		expect(await store.get<number>('lastPoll')).toBe(before);
		addFile({ id: 'mine-2' });
		expect(await poll({ store })).toEqual(['mine-2']);
		expect(await poll({ store })).toEqual([]);
		drive.unsearched = new Set();
		drive.stillIncomplete = new Set();
		expect(await poll({ store })).toEqual(['shared-file']);
		expect(await poll({ store })).toEqual([]);
		expect(await store.get('heldWindow')).toBeNull();
	});

	it('re-delivers rather than loses files when clearing the held window fails', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store, includeTeamDrives: true }));
		addFile({ id: 'shared-file', driveId: 'shared-legal' });
		addFile({ id: 'mine-1' });
		drive.unsearched = new Set(['shared-legal']);
		drive.stillIncomplete = new Set(['shared-legal']);
		expect(await poll({ store })).toEqual(['mine-1']);
		drive.unsearched = new Set();
		drive.stillIncomplete = new Set();
		vi.spyOn(store, 'delete').mockRejectedValueOnce(new Error('StorageError: delete failed'));
		await expect(poll({ store })).rejects.toThrow(/StorageError/);
		expect(await poll({ store })).toEqual(['shared-file']);
		expect(await poll({ store })).toEqual([]);
	});

	it('keeps delivering other drives while one shared drive keeps failing, then delivers its files once', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store, includeTeamDrives: true }));
		addFile({ id: 'broken-file', driveId: 'shared-broken' });
		addFile({ id: 'healthy-file', driveId: 'shared-ok' });
		addFile({ id: 'mine-1' });
		drive.unsearched = new Set(['shared-broken']);
		drive.failing = new Set(['shared-broken']);
		expect(await poll({ store })).toEqual(['mine-1', 'healthy-file']);
		expect(await poll({ store })).toEqual([]);
		addFile({ id: 'mine-2' });
		expect(await poll({ store })).toEqual(['mine-2']);
		drive.unsearched = new Set();
		drive.failing = new Set();
		expect(await poll({ store })).toEqual(['broken-file']);
		expect(await poll({ store })).toEqual([]);
	});

	it('keeps delivering other drives while one shared drive times out, then delivers its files once', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store, includeTeamDrives: true }));
		addFile({ id: 'slow-file', driveId: 'shared-slow' });
		addFile({ id: 'mine-1' });
		drive.unsearched = new Set(['shared-slow']);
		drive.hanging = new Set(['shared-slow']);
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		const pending = poll({ store });
		await vi.advanceTimersByTimeAsync(10_000);
		expect(await pending).toEqual(['mine-1']);
		vi.useRealTimers();
		drive.unsearched = new Set();
		drive.hanging = new Set();
		expect(await poll({ store })).toEqual(['slow-file']);
		expect(await poll({ store })).toEqual([]);
	});

	it('stops holding the cursor once too many spreadsheets were delivered meanwhile, and says so', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store, includeTeamDrives: true }));
		await store.put('heldWindow', { incompleteDrives: ['shared-legal'], emittedIds: Array.from({ length: 5000 }, (_, index) => `old-${index}`) });
		addFile({ id: 'shared-file', driveId: 'shared-legal' });
		addFile({ id: 'mine-1' });
		drive.unsearched = new Set(['shared-legal']);
		drive.stillIncomplete = new Set(['shared-legal']);
		expect(await poll({ store })).toEqual(['mine-1']);
		expect(await store.get('heldWindow')).toBeNull();
		expect(warn.mock.calls.some(([message]) => String(message).includes('too long'))).toBe(true);
		expect(await poll({ store })).toEqual([]);
	});

	it('still throws and keeps the cursor when My Drive itself is incomplete', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store, includeTeamDrives: false }));
		const before = await store.get<number>('lastPoll');
		addFile({ id: 'mine' });
		vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(async () => ({ data: { files: [], incompleteSearch: true } }));
		await expect(poll({ store, includeTeamDrives: false })).rejects.toThrow(/could not search every file in My Drive/);
		expect(await store.get<number>('lastPoll')).toBe(before);
	});

	it('times out a hanging list call instead of hanging the poll', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store, includeTeamDrives: true }));
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		drive.hang = true;
		const pending = poll({ store });
		const settled = expect(pending).rejects.toThrow(/took too long/);
		await vi.advanceTimersByTimeAsync(10_000);
		await settled;
	});

	it('lists only My Drive when Include Team Drives is off', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store, includeTeamDrives: false }));
		addFile({ id: 'mine' });
		expect(await poll({ store, includeTeamDrives: false })).toEqual(['mine']);
		expect(new Set(drive.corpora)).toEqual(new Set(['user']));
	});
});
