import {
  DuckDBConnection,
  DuckDBInstance,
  DuckDBResultReader,
  DuckDBValue,
  DuckDBValueConverter,
  Json,
  JsonDuckDBValueConverter,
  quotedIdentifier,
} from '@duckdb/node-api';

async function withDatabase<T>({
  run,
}: {
  run: (connection: DuckDBConnection) => Promise<T>;
}): Promise<T> {
  const instance = await DuckDBInstance.create(':memory:');
  const connection = await instance.connect();
  try {
    await connection.run(`
      SET enable_logging = 0;
      SET enable_external_access = false;
      SET lock_configuration = true;
    `);
    return await run(connection);
  } finally {
    connection.closeSync();
    instance.closeSync();
  }
}

async function detectRowStructure({
  connection,
  rows,
}: {
  connection: DuckDBConnection;
  rows: Record<string, unknown>[];
}): Promise<Json> {
  const reader = await connection.runAndReadAll(
    'SELECT json_structure($data)::VARCHAR AS structure',
    { data: JSON.stringify(rows) }
  );
  const structure: unknown = JSON.parse(String(reader.getRows()[0][0]));
  const rowStructure = Array.isArray(structure) ? structure[0] : undefined;
  if (!isJsonObject(rowStructure)) {
    throw new Error(
      'Could not detect columns: every row must be a JSON object with at least one key.'
    );
  }
  return rowStructure;
}

async function loadTable({
  connection,
  name,
  rows,
}: {
  connection: DuckDBConnection;
  name: string;
  rows: Record<string, unknown>[];
}): Promise<void> {
  const structure = await detectRowStructure({ connection, rows });
  await connection.run(
    `CREATE TABLE ${quotedIdentifier(
      name
    )} AS SELECT r.* FROM (SELECT UNNEST(JSON_TRANSFORM($data, $schema)) AS r) t`,
    {
      data: JSON.stringify(rows),
      schema: JSON.stringify([structure]),
    }
  );
}

async function loadIndexedRows({
  connection,
  name,
  rows,
  structure,
}: {
  connection: DuckDBConnection;
  name: string;
  rows: Record<string, unknown>[];
  structure: Json;
}): Promise<void> {
  await connection.run(
    `CREATE TABLE ${quotedIdentifier(
      name
    )} AS SELECT x.i AS i, x.r AS r FROM (SELECT UNNEST(JSON_TRANSFORM($data, $schema)) AS x) t`,
    {
      data: JSON.stringify(rows.map((row, i) => ({ i, r: row }))),
      schema: JSON.stringify([{ i: 'UBIGINT', r: structure }]),
    }
  );
}

function readRows({
  reader,
}: {
  reader: DuckDBResultReader;
}): Record<string, Json>[] {
  return reader
    .convertRowObjects(jsonConverter)
    .map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, value ?? null])
      )
    );
}

function readColumns({
  reader,
}: {
  reader: DuckDBResultReader;
}): { name: string; type: string }[] {
  const types = reader.columnTypes();
  return reader
    .columnNames()
    .map((name, i) => ({ name, type: types[i].toString() }));
}

function readIndexes({ reader }: { reader: DuckDBResultReader }): number[] {
  return reader.getRows().map((row) => Number(row[0]));
}

function parseRows({
  value,
  propName,
  allowEmpty = false,
}: {
  value: unknown;
  propName: string;
  allowEmpty?: boolean;
}): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    throw new Error(`${propName} must be a JSON array of row objects.`);
  }
  if (!allowEmpty && value.length === 0) {
    throw new Error(
      `${propName} has no rows; columns are detected from the rows, so give at least one.`
    );
  }
  const badIndex = value.findIndex((row) => !isPlainObject(row));
  if (badIndex !== -1) {
    throw new Error(
      `${propName}[${badIndex}] is not a JSON object; every row must be an object of column → value.`
    );
  }
  return value.filter(isPlainObject);
}

function parseKeyColumns({
  value,
  propName,
}: {
  value: unknown;
  propName: string;
}): string[] {
  const columns: unknown[] = Array.isArray(value) ? value : [];
  const badIndex = columns.findIndex(
    (column) => typeof column !== 'string' || column.length === 0
  );
  if (badIndex !== -1) {
    throw new Error(`${propName}[${badIndex}] must be a non-empty column name.`);
  }
  return columns.filter(
    (column): column is string => typeof column === 'string'
  );
}

function keyExpression({
  alias,
  column,
}: {
  alias: string;
  column: string;
}): string {
  return `${alias}.r[${quoteLiteral(column)}]`;
}

function quoteLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJsonObject(value: unknown): value is { [key: string]: Json } {
  return isPlainObject(value) && Object.keys(value).length > 0;
}

const jsonConverter: DuckDBValueConverter<Json> = (
  value: DuckDBValue,
  type,
  converter
) => {
  if (typeof value === 'bigint') {
    return value >= BigInt(Number.MIN_SAFE_INTEGER) &&
      value <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : value.toString();
  }
  return JsonDuckDBValueConverter(value, type, converter);
};

export const duckdbClient = {
  withDatabase,
  detectRowStructure,
  loadTable,
  loadIndexedRows,
  readRows,
  readColumns,
  readIndexes,
  parseRows,
  parseKeyColumns,
  keyExpression,
  isPlainObject,
};
