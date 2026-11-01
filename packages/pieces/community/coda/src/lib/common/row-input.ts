import { codaApi } from './client';

const MAX_ROWS_PER_REQUEST = 500;

function toRecord({ value, label }: { value: unknown; label: string }): Record<string, unknown> {
	const parsed = codaApi.parseJsonInput({ value, label });
	if (!codaApi.isRecord(parsed)) {
		throw new Error(`${label} must be an object of column → value, for example {"Name": "Ada", "Amount": 5}.`);
	}
	return parsed;
}

function toRows({ value, label }: { value: unknown; label: string }): Record<string, unknown>[] {
	const parsed = codaApi.parseJsonInput({ value, label });
	const list = Array.isArray(parsed) ? parsed : codaApi.isRecord(parsed) ? [parsed] : undefined;
	if (!list || list.length === 0) {
		throw new Error(`${label} must be a non-empty list of objects, for example [{"Name": "Ada", "Amount": 5}].`);
	}
	if (list.length > MAX_ROWS_PER_REQUEST) {
		throw new Error(`${label} can hold at most ${MAX_ROWS_PER_REQUEST} rows per call; split the list into smaller batches.`);
	}
	return list.map((row, index) => {
		if (!codaApi.isRecord(row)) {
			throw new Error(`${label}: item ${index + 1} must be an object of column → value.`);
		}
		return row;
	});
}

function insertCells({ row, rowNumber }: { row: Record<string, unknown>; rowNumber: number }): CodaCell[] {
	const cells = Object.entries(row)
		.filter(([column, value]) => column.trim().length > 0 && value !== undefined && value !== null)
		.map(([column, value]) => ({ column: column.trim(), value }));
	if (cells.length === 0) {
		throw new Error(`Row ${rowNumber} has no column values.`);
	}
	return cells;
}

function updateCells(cells: Record<string, unknown>): CodaCell[] {
	const edits = Object.entries(cells)
		.filter(([column, value]) => column.trim().length > 0 && value !== undefined)
		.map(([column, value]) => ({ column: column.trim(), value: value === null ? '' : value }));
	if (edits.length === 0) {
		throw new Error('Provide at least one column to change.');
	}
	return edits;
}

function toStringList({ value, label }: { value: unknown; label: string }): string[] {
	const list = Array.isArray(value) ? value : typeof value === 'string' ? splitText({ text: value, label }) : [];
	const items = list
		.filter((item) => item !== undefined && item !== null)
		.map((item) => String(item).trim())
		.filter((item) => item.length > 0);
	return [...new Set(items)];
}

function splitText({ text, label }: { text: string; label: string }): unknown[] {
	if (text.trim().startsWith('[')) {
		const parsed = codaApi.parseJsonInput({ value: text, label });
		return Array.isArray(parsed) ? parsed : [];
	}
	return text.split(',');
}

function hasValue(value: unknown): boolean {
	return value !== undefined && value !== null && !(typeof value === 'string' && value.trim().length === 0);
}

export const rowInput = {
	toRecord,
	toRows,
	insertCells,
	updateCells,
	toStringList,
	hasValue,
	MAX_ROWS_PER_REQUEST,
};

export type CodaCell = {
	column: string;
	value: unknown;
};
