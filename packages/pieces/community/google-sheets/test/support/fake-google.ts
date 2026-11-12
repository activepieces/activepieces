import { drive_v3 } from '@googleapis/drive';
import { sheets_v4 } from '@googleapis/sheets';
import { vi } from 'vitest';
import { isRecord } from './engine-context';

const STORE_VALUE_MAX_SIZE = 512 * 1024;

export type FakeCell = { value: string | number; format?: (value: number) => string };
export type FakeTab = { sheetId: number; title: string; rows: FakeCell[][] };

export const fakeGoogle: FakeGoogleState = {
	tabs: [],
	liveChannels: new Set<string>(),
	failNextWatch: false,
	failNextStop: false,
	beforeNextWatch: undefined,
	valueReads: [],
	gridReads: [],
	watchCount: 0,
	afterNextGridRead: undefined,
	holdNextGridRead: undefined,
	heldGridReads: 0,
};

export function cells({ values }: { values: (string | number)[] }): FakeCell[] {
	return values.map((value) => ({ value }));
}

export function resetFakeGoogle({ tabs }: { tabs: FakeTab[] }): void {
	fakeGoogle.tabs = tabs;
	fakeGoogle.liveChannels = new Set();
	fakeGoogle.failNextWatch = false;
	fakeGoogle.beforeNextWatch = undefined;
	fakeGoogle.failNextStop = false;
	fakeGoogle.valueReads = [];
	fakeGoogle.gridReads = [];
	fakeGoogle.watchCount = 0;
	fakeGoogle.afterNextGridRead = undefined;
	fakeGoogle.holdNextGridRead = undefined;
	fakeGoogle.heldGridReads = 0;
}

function render({ cell, option }: { cell: FakeCell | undefined; option: string | undefined }): string | number {
	if (cell === undefined) return '';
	if (typeof cell.value !== 'number') return cell.value;
	if (option === 'UNFORMATTED_VALUE') return cell.value;
	return cell.format ? cell.format(cell.value) : String(cell.value);
}

function trimRows({ rows }: { rows: (string | number)[][] }): (string | number)[][] {
	const trimmed = rows.map((row) => {
		const out = [...row];
		while (out.length > 0 && out[out.length - 1] === '') out.pop();
		return out;
	});
	while (trimmed.length > 0 && trimmed[trimmed.length - 1].length === 0) trimmed.pop();
	return trimmed;
}

function resolveRange({ range }: { range: string }): { tab: FakeTab; from: number; to: number | undefined } {
	let title: string;
	let sub: string | undefined;
	if (range.startsWith("'")) {
		const match = /^'((?:[^']|'')*)'(?:!(.*))?$/.exec(range);
		if (!match) throw new Error(`Unable to parse range: ${range}`);
		title = match[1].replace(/''/g, "'");
		sub = match[2];
	} else if (range.includes('!')) {
		title = range.slice(0, range.indexOf('!'));
		sub = range.slice(range.indexOf('!') + 1);
	} else if (/^[A-Za-z]{1,3}[0-9]+$/.test(range)) {
		title = fakeGoogle.tabs[0].title;
		sub = range;
	} else {
		title = range;
	}
	const tab = fakeGoogle.tabs.find((candidate) => candidate.title === title);
	if (!tab) throw new Error(`Unable to parse range: ${range}`);
	if (sub === undefined || sub === '') return { tab, from: 1, to: undefined };
	const rowSpan = /^(\d+):(\d+)$/.exec(sub);
	if (rowSpan) return { tab, from: Number(rowSpan[1]), to: Number(rowSpan[2]) };
	throw new Error(`fake does not support range ${range}`);
}

export function installFakeGoogle(): void {
	vi.spyOn(sheets_v4.Resource$Spreadsheets.prototype, 'get').mockImplementation(async (...args: unknown[]) => {
		const gridRange = gridParams({ params: args[0] });
		if (gridRange !== undefined) {
			return serveGrid({ range: gridRange });
		}
		return {
		data: {
			sheets: fakeGoogle.tabs.map((tab, index) => ({
				properties: { sheetId: tab.sheetId, title: tab.title, index, sheetType: 'GRID', gridProperties: { rowCount: 1000, columnCount: 26 } },
			})),
		},
		};
	});
	vi.spyOn(sheets_v4.Resource$Spreadsheets$Values.prototype, 'get').mockImplementation(async (...args: unknown[]) => {
		const { range, option } = valuesParams({ params: args[0] });
		fakeGoogle.valueReads.push({ range, option });
		const { tab, from, to } = resolveRange({ range });
		const last = to ?? tab.rows.length;
		const rows = tab.rows.slice(from - 1, last).map((row) => row.map((cell) => render({ cell, option })));
		const values = trimRows({ rows });
		const after = fakeGoogle.afterNextGridRead;
		if (after && to === undefined) {
			fakeGoogle.afterNextGridRead = undefined;
			after();
		}
		const hold = fakeGoogle.holdNextGridRead;
		if (hold && to === undefined) {
			fakeGoogle.holdNextGridRead = undefined;
			fakeGoogle.heldGridReads += 1;
			await hold;
		}
		return { data: values.length > 0 ? { range, values } : { range } };
	});
	vi.spyOn(drive_v3.Resource$Files.prototype, 'watch').mockImplementation(async (...args: unknown[]) => {
		const id = channelId({ params: args[0] });
		const before = fakeGoogle.beforeNextWatch;
		if (before) {
			fakeGoogle.beforeNextWatch = undefined;
			before();
		}
		if (fakeGoogle.failNextWatch) {
			fakeGoogle.failNextWatch = false;
			throw Object.assign(new Error('Backend Error'), { code: 503 });
		}
		fakeGoogle.watchCount += 1;
		fakeGoogle.liveChannels.add(id);
		return { data: { kind: 'api#channel', id, resourceId: 'res-1', expiration: channelExpiration({ params: args[0] }) } };
	});
	vi.spyOn(drive_v3.Resource$Channels.prototype, 'stop').mockImplementation(async (...args: unknown[]) => {
		const id = channelId({ params: args[0] });
		if (fakeGoogle.failNextStop) {
			fakeGoogle.failNextStop = false;
			throw Object.assign(new Error('Backend Error'), { code: 503 });
		}
		if (!fakeGoogle.liveChannels.has(id)) {
			throw Object.assign(new Error(`Channel ${id} not found for project`), { code: 404 });
		}
		fakeGoogle.liveChannels.delete(id);
		return { data: undefined };
	});
}

function gridParams({ params }: { params: unknown }): string | undefined {
	if (!isRecord(params) || params['includeGridData'] !== true) return undefined;
	const ranges = params['ranges'];
	if (!Array.isArray(ranges) || ranges.length === 0) return undefined;
	const first: unknown = ranges[0];
	return typeof first === 'string' ? first : undefined;
}

function cellData({ cell }: { cell: FakeCell | undefined }): sheets_v4.Schema$CellData {
	if (cell === undefined || cell.value === '') return {};
	if (typeof cell.value === 'number') {
		return { effectiveValue: { numberValue: cell.value }, formattedValue: cell.format ? cell.format(cell.value) : String(cell.value) };
	}
	return { effectiveValue: { stringValue: cell.value }, formattedValue: cell.value };
}

async function serveGrid({ range }: { range: string }): Promise<{ data: sheets_v4.Schema$Spreadsheet }> {
	const { tab } = resolveRange({ range });
	fakeGoogle.gridReads.push({ range });
	const rowData = tab.rows.map((row) => ({ values: row.map((cell) => cellData({ cell })) }));
	const after = fakeGoogle.afterNextGridRead;
	if (after) {
		fakeGoogle.afterNextGridRead = undefined;
		after();
	}
	const hold = fakeGoogle.holdNextGridRead;
	if (hold) {
		fakeGoogle.holdNextGridRead = undefined;
		fakeGoogle.heldGridReads += 1;
		await hold;
	}
	return { data: { sheets: [{ properties: { sheetId: tab.sheetId, title: tab.title }, data: [{ startRow: 0, rowData }] }] } };
}

function valuesParams({ params }: { params: unknown }): { range: string; option: string | undefined } {
	if (!isRecord(params) || typeof params['range'] !== 'string') throw new Error('values.get called without a range');
	const option = params['valueRenderOption'];
	return { range: params['range'], option: typeof option === 'string' ? option : undefined };
}

function channelExpiration({ params }: { params: unknown }): string | undefined {
	const body = isRecord(params) ? params['requestBody'] : undefined;
	const expiration = isRecord(body) ? body['expiration'] : undefined;
	return typeof expiration === 'string' ? expiration : undefined;
}

function channelId({ params }: { params: unknown }): string {
	const body = isRecord(params) ? params['requestBody'] : undefined;
	if (!isRecord(body) || typeof body['id'] !== 'string') throw new Error('channel call without a requestBody.id');
	return body['id'];
}

export function memoryStore() {
	const data = new Map<string, string>();
	const failPuts: { matching: RegExp | undefined } = { matching: undefined };
	return {
		data,
		failPuts,
		store: {
			put: async <T>(key: string, value: T): Promise<T> => {
				const json = JSON.stringify(value) ?? 'null';
				if (Buffer.byteLength(json, 'utf8') > STORE_VALUE_MAX_SIZE) throw new Error(`StorageLimitError: ${key}`);
				if (failPuts.matching && failPuts.matching.test(key)) throw new Error(`StorageError: put ${key} failed`);
				data.set(key, json);
				return value;
			},
			get: async <T>(key: string): Promise<T | null> => {
				const raw = data.get(key);
				return raw === undefined ? null : JSON.parse(raw);
			},
			delete: async (key: string): Promise<void> => {
				data.delete(key);
			},
		},
	};
}

export const storeLimit = STORE_VALUE_MAX_SIZE;

type FakeGoogleState = {
	tabs: FakeTab[];
	liveChannels: Set<string>;
	failNextWatch: boolean;
	beforeNextWatch: (() => void) | undefined;
	failNextStop: boolean;
	valueReads: { range: string; option: string | undefined }[];
	gridReads: { range: string }[];
	watchCount: number;
	afterNextGridRead: (() => void) | undefined;
	holdNextGridRead: Promise<void> | undefined;
	heldGridReads: number;
};
