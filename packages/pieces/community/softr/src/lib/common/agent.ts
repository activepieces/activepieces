import { HttpMethod } from '@activepieces/pieces-common';
import { softrClient } from './client';
import { softrRecords } from './records';
import { softrSearch } from './search';
import { SoftrListResponse, SoftrRecord, SoftrTable, TableField } from './types';

const NUMERIC_TYPES = ['NUMBER', 'CURRENCY', 'PERCENT', 'RATING', 'DURATION'];

async function listTables({ apiKey, databaseId }: { apiKey: string; databaseId: string }): Promise<SoftrTable[]> {
	const response = await softrClient.request<SoftrListResponse<SoftrTable>>({
		apiKey,
		method: HttpMethod.GET,
		path: `${softrClient.databasePath({ databaseId })}/tables`,
	});
	return response.data ?? [];
}

function requireText({ value, label }: { value: unknown; label: string }): string {
	const text = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
	if (text.length === 0) {
		throw new Error(`${label} is required.`);
	}
	return text;
}

function pickTable({ tables, reference }: { tables: SoftrTable[]; reference: string }): SoftrTable {
	const byId = tables.find((table) => table.id === reference);
	if (byId) {
		return byId;
	}
	const lowered = reference.toLowerCase();
	const byName = tables.filter((table) => table.name.toLowerCase() === lowered);
	if (byName.length === 1) {
		return byName[0];
	}
	if (byName.length > 1) {
		const ids = byName.map((table) => table.id).join(', ');
		throw new Error(`${byName.length} tables are named "${reference}" (IDs: ${ids}). Pass the table ID instead.`);
	}
	const names = tables.map((table) => `${table.name} (${table.id})`).join(', ');
	throw new Error(`Table "${reference}" was not found in this database. Tables: ${names || 'none'}.`);
}

async function resolveTable({ apiKey, databaseId, reference }: ResolveTableParams): Promise<SoftrTable> {
	const tables = await listTables({ apiKey, databaseId });
	const table = pickTable({ tables, reference });
	if (Array.isArray(table.fields)) {
		return table;
	}
	return softrClient.getTable({ apiKey, databaseId, tableId: table.id });
}

function parseFieldsInput(value: unknown): Record<string, unknown> {
	const parsed: unknown = typeof value === 'string' ? parseJson(value) : value;
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw new Error('Fields must be a JSON object keyed by column name or field ID, e.g. {"Name": "Jane", "Age": 30}.');
	}
	return Object.fromEntries(Object.entries(parsed));
}

function parseJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		throw new Error('Fields is not valid JSON. Send an object such as {"Name": "Jane"}.');
	}
}

function writableNames(fields: TableField[]): string {
	return fields
		.filter((field) => !field.readonly)
		.map((field) => field.name)
		.join(', ');
}

function findColumn({ fields, reference }: { fields: TableField[]; reference: string }): TableField {
	const trimmed = reference.trim();
	const byId = fields.find((field) => field.id === trimmed);
	if (byId) {
		return byId;
	}
	const lowered = trimmed.toLowerCase();
	const byName = fields.filter((field) => field.name.toLowerCase() === lowered);
	if (byName.length === 1) {
		return byName[0];
	}
	if (byName.length > 1) {
		throw new Error(`More than one column is named "${trimmed}". Use the field ID instead (see Get Database Schema (Agent)).`);
	}
	throw new Error(`Column "${trimmed}" does not exist in this table. Valid columns: ${writableNames(fields)}.`);
}

function toChoiceId({ field, value }: { field: TableField; value: unknown }): string {
	const choices = field.options?.choices ?? [];
	const text = typeof value === 'string' ? value.trim() : String(value);
	if (choices.length === 0) {
		return text;
	}
	const match =
		choices.find((choice) => choice.id === text) ??
		choices.find((choice) => choice.label.toLowerCase() === text.toLowerCase());
	if (!match) {
		const labels = choices.map((choice) => choice.label).join(', ');
		throw new Error(`A value given for column "${field.name}" is not one of its options. Options: ${labels}.`);
	}
	return match.id;
}

function convertSelect({ field, value }: { field: TableField; value: unknown }): string | string[] {
	const items = Array.isArray(value) ? value : [value];
	const ids = items.map((item) => toChoiceId({ field, value: item }));
	if (field.allowMultipleEntries) {
		return ids;
	}
	if (ids.length !== 1) {
		throw new Error(`Column "${field.name}" holds a single option, so give one value (got ${ids.length}).`);
	}
	return ids[0];
}

function convertValue({ field, value }: { field: TableField; value: unknown }): unknown {
	if (value === undefined || value === null || value === '') {
		return value;
	}
	if (field.type === 'SELECT') {
		return convertSelect({ field, value });
	}
	if (NUMERIC_TYPES.includes(field.type) || field.type === 'CHECKBOX') {
		if (typeof value === 'object') {
			throw new Error(`Column "${field.name}" (${field.type}) needs a single value, not a list or object.`);
		}
		return softrSearch.coerceScalar({ field, value });
	}
	return value;
}

function buildFieldValues({ table, fields }: { table: SoftrTable; fields: Record<string, unknown> }): Record<string, unknown> {
	const values: Record<string, unknown> = {};
	for (const [reference, value] of Object.entries(fields)) {
		const field = findColumn({ fields: table.fields, reference });
		if (field.readonly) {
			throw new Error(`Column "${field.name}" (${field.type}) is read-only. Writable columns: ${writableNames(table.fields)}.`);
		}
		if (field.id in values) {
			throw new Error(`Column "${field.name}" is given more than once.`);
		}
		values[field.id] = convertValue({ field, value });
	}
	const compacted = softrRecords.compactFieldValues(values);
	if (Object.keys(compacted).length === 0) {
		throw new Error('Fields is empty. Give at least one column with a non-empty value.');
	}
	return compacted;
}

async function upsertRecord({ apiKey, databaseId, table, keyField, fields }: UpsertParams): Promise<UpsertResult> {
	const key = findColumn({ fields: table.fields, reference: keyField });
	const values = buildFieldValues({ table, fields });
	const keyValue = values[key.id];
	if (keyValue === undefined) {
		throw new Error(`Fields must include a value for the key column "${key.name}".`);
	}
	if (Array.isArray(keyValue)) {
		throw new Error(`The key column "${key.name}" must hold a single value.`);
	}
	const condition = softrSearch.buildCondition({ field: key, operator: 'IS', value: keyValue });
	const response = await softrRecords.searchRecords({
		apiKey,
		databaseId,
		tableId: table.id,
		body: {
			paging: { offset: 0, limit: 2 },
			filter: { condition: { operator: 'AND', conditions: [condition] } },
		},
	});
	const matches = response.data ?? [];
	const total = response.metadata?.total ?? matches.length;
	if (total > 1 || matches.length > 1) {
		throw new Error(
			`${Math.max(total, matches.length)} records match the given ${key.name}, refusing to guess. Use Update Record (Agent) with a record ID.`,
		);
	}
	const existing = matches[0];
	const record = await softrRecords.writeRecord({
		apiKey,
		databaseId,
		tableId: table.id,
		recordId: existing?.id,
		fields: values,
		tableFields: table.fields,
	});
	return { action: existing ? 'updated' : 'created', record };
}

type ResolveTableParams = {
	apiKey: string;
	databaseId: string;
	reference: string;
};

type UpsertParams = {
	apiKey: string;
	databaseId: string;
	table: SoftrTable;
	keyField: string;
	fields: Record<string, unknown>;
};

type UpsertResult = {
	action: 'created' | 'updated';
	record: SoftrRecord;
};

export const softrAgent = {
	listTables,
	requireText,
	resolveTable,
	parseFieldsInput,
	buildFieldValues,
	upsertRecord,
};
