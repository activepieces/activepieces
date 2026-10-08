import { TeableAuthValue } from '../auth';
import { teableClient, TeableField, TeableRecord, TeableTable } from './client';
import { teableProps } from './index';

function requireText({ value, label }: { value: unknown; label: string }): string {
  const text =
    typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
  if (text.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function parseFieldsInput(value: unknown): Record<string, unknown> {
  const parsed: unknown = typeof value === 'string' ? parseJson(value) : value;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      'Fields must be a JSON object keyed by column name or field ID, e.g. {"Name": "Jane", "Age": 30}.'
    );
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

function pickTable({
  tables,
  reference,
}: {
  tables: TeableTable[];
  reference: string;
}): TeableTable {
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
    throw new Error(
      `${byName.length} tables are named "${reference}" (IDs: ${ids}). Pass the table ID instead.`
    );
  }
  const names = tables.map((table) => `${table.name} (${table.id})`).join(', ');
  throw new Error(`Table "${reference}" was not found in this base. Tables: ${names || 'none'}.`);
}

async function resolveTable({
  auth,
  baseId,
  reference,
}: {
  auth: TeableAuthValue;
  baseId: string;
  reference: string;
}): Promise<TeableTable> {
  const tables = await teableClient.listTables({ auth, baseId });
  return pickTable({ tables, reference });
}

function writableNames(fields: TeableField[]): string {
  return fields
    .filter((field) => teableProps.isRecordWritableField(field))
    .map((field) => field.name)
    .join(', ');
}

function findColumn({
  fields,
  reference,
}: {
  fields: TeableField[];
  reference: string;
}): TeableField {
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
    throw new Error(
      `More than one column is named "${trimmed}". Use the field ID instead (see Get Base Schema (Agent)).`
    );
  }
  throw new Error(
    `Column "${trimmed}" does not exist in this table. Valid columns: ${writableNames(fields)}.`
  );
}

function buildRecordFields({
  fields,
  input,
  allowClear,
}: {
  fields: TeableField[];
  input: Record<string, unknown>;
  allowClear: boolean;
}): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [reference, value] of Object.entries(input)) {
    const field = findColumn({ fields, reference });
    if (!teableProps.isRecordWritableField(field)) {
      throw new Error(
        `Column "${field.name}" (${field.type}) cannot be written. Writable columns: ${writableNames(
          fields
        )}.`
      );
    }
    if (field.id in values) {
      throw new Error(`Column "${field.name}" is given more than once.`);
    }
    if (value === null || value === '') {
      if (!allowClear) {
        continue;
      }
      values[field.id] = null;
      continue;
    }
    if (value === undefined) {
      continue;
    }
    values[field.id] = value;
  }
  if (Object.keys(values).length === 0) {
    throw new Error('Fields is empty. Give at least one column with a value.');
  }
  return values;
}

function mapFieldIdsToNames({
  fields,
  record,
}: {
  fields: TeableField[];
  record: TeableRecord;
}): TeableRecord {
  const nameById = new Map(fields.map((field) => [field.id, field.name]));
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record.fields ?? {})) {
    mapped[nameById.get(key) ?? key] = value;
  }
  return { ...record, fields: mapped };
}

function buildIsFilter({ fieldId, value }: { fieldId: string; value: unknown }): string {
  return JSON.stringify({
    conjunction: 'and',
    filterSet: [{ fieldId, operator: 'is', value }],
  });
}

async function findKeyMatches({
  auth,
  table,
  key,
  keyValue,
}: {
  auth: TeableAuthValue;
  table: TeableTable;
  key: TeableField;
  keyValue: unknown;
}): Promise<TeableRecord[]> {
  const matches = await teableClient.listRecords({
    auth,
    tableId: table.id,
    query: {
      take: 2,
      fieldKeyType: 'id',
      filter: buildIsFilter({ fieldId: key.id, value: keyValue }),
    },
  });
  return matches.records;
}

async function upsertRecord({
  auth,
  table,
  fields,
  keyColumn,
  input,
}: {
  auth: TeableAuthValue;
  table: TeableTable;
  fields: TeableField[];
  keyColumn: string;
  input: Record<string, unknown>;
}): Promise<{ action: 'created' | 'updated'; record: TeableRecord; warning?: string }> {
  const key = findColumn({ fields, reference: keyColumn });
  const updateValues = buildRecordFields({ fields, input, allowClear: true });
  const keyValue = updateValues[key.id];
  if (keyValue === undefined || keyValue === null) {
    throw new Error(`Fields must include a value for the key column "${key.name}".`);
  }
  if (typeof keyValue === 'object') {
    throw new Error(`The key column "${key.name}" must hold a single text or number value.`);
  }
  const matches = await findKeyMatches({ auth, table, key, keyValue });
  if (matches.length > 1) {
    throw new Error(
      `More than one record matches ${key.name} = "${String(
        keyValue
      )}", refusing to guess. Use Update Record (Agent) with a record ID.`
    );
  }
  const existing = matches[0];
  if (existing === undefined) {
    const createValues = buildRecordFields({ fields, input, allowClear: false });
    const created = await teableClient.createRecords({
      auth,
      tableId: table.id,
      records: [{ fields: createValues }],
      fieldKeyType: 'id',
      typecast: true,
    });
    const recheck = await findKeyMatches({ auth, table, key, keyValue });
    const warning =
      recheck.length > 1
        ? `More than one record now matches ${key.name} = "${String(
            keyValue
          )}": a parallel upsert likely created a duplicate, since Teable has no atomic create-if-absent. Run same-key upserts one at a time and remove the extra record.`
        : undefined;
    return {
      action: 'created',
      record: mapFieldIdsToNames({ fields, record: created.records[0] }),
      ...(warning !== undefined ? { warning } : {}),
    };
  }
  const updated = await teableClient.updateRecord({
    auth,
    tableId: table.id,
    recordId: existing.id,
    fields: updateValues,
    fieldKeyType: 'id',
    typecast: true,
  });
  return { action: 'updated', record: mapFieldIdsToNames({ fields, record: updated }) };
}

export const teableAgent = {
  requireText,
  parseFieldsInput,
  resolveTable,
  findColumn,
  buildRecordFields,
  mapFieldIdsToNames,
  buildIsFilter,
  upsertRecord,
  writableNames,
};
