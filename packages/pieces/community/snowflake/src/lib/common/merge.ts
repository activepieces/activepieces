import type { Bind } from 'snowflake-sdk';
import { identifier, qualifiedName, toBind, valuePlaceholder } from './sql';

export function buildMerge({
  table,
  keyColumns,
  values,
}: {
  table: string;
  keyColumns: string[];
  values: Record<string, unknown>;
}): { sql: string; binds: Bind[] } {
  const columns = Object.keys(values);
  if (keyColumns.length === 0) {
    throw new Error('Provide at least one key column.');
  }
  const missing = keyColumns.filter((key) => !(key in values));
  if (missing.length > 0) {
    throw new Error(
      `Key column(s) ${missing.join(
        ', '
      )} must also be included in the row values.`
    );
  }
  const nullKeys = keyColumns.filter(
    (key) => values[key] === null || values[key] === undefined
  );
  if (nullKeys.length > 0) {
    throw new Error(
      `Key column(s) ${nullKeys.join(
        ', '
      )} must have a value; a NULL key never matches an existing row, so the upsert would insert a duplicate.`
    );
  }
  const updateColumns = columns.filter(
    (column) => !keyColumns.includes(column)
  );
  if (updateColumns.length === 0) {
    throw new Error(
      'At least one column other than the key column(s) must be provided to update.'
    );
  }
  const binds: Bind[] = [];
  const aliases = new Map<string, string>();
  const sourceSelects = columns.map((column, index) => {
    const alias = `C${index}`;
    aliases.set(column, alias);
    binds.push(toBind(values[column]));
    return `${valuePlaceholder(values[column])} AS ${alias}`;
  });
  const ref = (column: string) => `source.${aliases.get(column)}`;
  const target = (column: string) =>
    `target.${identifier({ name: column, label: 'Column' })}`;
  const on = keyColumns
    .map((key) => `${target(key)} = ${ref(key)}`)
    .join(' AND ');
  const updates = updateColumns
    .map((column) => `${target(column)} = ${ref(column)}`)
    .join(', ');
  const insertColumns = columns
    .map((column) => identifier({ name: column, label: 'Column' }))
    .join(', ');
  const insertValues = columns.map(ref).join(', ');
  const sql = [
    `MERGE INTO ${qualifiedName({ value: table, label: 'Table' })} AS target`,
    `USING (SELECT ${sourceSelects.join(', ')}) AS source`,
    `ON ${on}`,
    `WHEN MATCHED THEN UPDATE SET ${updates}`,
    `WHEN NOT MATCHED THEN INSERT (${insertColumns}) VALUES (${insertValues})`,
  ].join('\n');
  return { sql, binds };
}
