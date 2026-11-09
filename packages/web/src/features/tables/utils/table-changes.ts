import { Field, PopulatedRecord } from '@activepieces/shared';

function recordKeys({
  before,
  records,
}: {
  before: PopulatedRecord[];
  records: PopulatedRecord[];
}): string[] {
  const known = new Map(before.map((record) => [record.id, record]));
  return records.flatMap((record) => {
    const old = known.get(record.id);
    if (!old) return [rowKey(record.id)];
    return Object.entries(record.cells)
      .filter(([fieldId, cell]) => old.cells[fieldId]?.value !== cell.value)
      .map(([fieldId]) => cellKey({ recordId: record.id, fieldId }));
  });
}

function fieldKeys({
  before,
  fields,
}: {
  before: Field[];
  fields: Field[];
}): string[] {
  const known = new Map(before.map((field) => [field.id, field]));
  return fields
    .filter((field) => {
      const old = known.get(field.id);
      return !old || old.name !== field.name || old.type !== field.type;
    })
    .map((field) => fieldKey(field.id));
}

function parse(key: string): TableChangeKey | null {
  const [scope, first, second] = key.split(':');
  if (scope === ROW && first) return { type: 'row', recordId: first };
  if (scope === CELL && first && second) {
    return { type: 'cell', recordId: first, fieldId: second };
  }
  if (scope === FIELD && first) return { type: 'field', fieldId: first };
  return null;
}

function rowKey(recordId: string): string {
  return `${ROW}:${recordId}`;
}

function cellKey({
  recordId,
  fieldId,
}: {
  recordId: string;
  fieldId: string;
}): string {
  return `${CELL}:${recordId}:${fieldId}`;
}

function fieldKey(fieldId: string): string {
  return `${FIELD}:${fieldId}`;
}

const ROW = 'table-row';
const CELL = 'table-cell';
const FIELD = 'table-field';

export const tableChanges = {
  recordKeys,
  fieldKeys,
  parse,
};

export type TableChangeKey =
  | { type: 'row'; recordId: string }
  | { type: 'cell'; recordId: string; fieldId: string }
  | { type: 'field'; fieldId: string };
