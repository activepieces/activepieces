import type {
  DatabricksColumn,
  DatabricksRowSource,
  DatabricksTableLocation,
} from './types';

function quoteIdentifier({ name }: { name: string }): string {
  return `\`${name.replace(/`/g, '``')}\``;
}

function tableRef({
  catalogName,
  schemaName,
  tableName,
}: DatabricksTableLocation): string {
  return [catalogName, schemaName, tableName]
    .map((name) => quoteIdentifier({ name }))
    .join('.');
}

function stringLiteral({ value }: { value: string }): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function convertToColumnType({
  column,
  expression,
}: {
  column: DatabricksColumn;
  expression: string;
}): string {
  const typeName = (column.type_name ?? 'STRING').toUpperCase();
  const typeText = column.type_text ?? typeName;
  if (typeName === 'STRING') {
    return expression;
  }
  if (typeName === 'VARIANT') {
    return `parse_json(${expression})`;
  }
  if (COMPLEX_TYPES.includes(typeName)) {
    return `from_json(${expression}, ${stringLiteral({
      value: typeText,
    })}, map('mode', 'FAILFAST'))`;
  }
  return `CAST(${expression} AS ${typeText})`;
}

function toParameterValue({ value }: { value: unknown }): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function compactRow({
  row,
}: {
  row: Record<string, unknown>;
}): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).filter(
      ([, value]) => value !== undefined && value !== ''
    )
  );
}

function findColumn({
  columns,
  name,
}: {
  columns: DatabricksColumn[];
  name: string;
}): DatabricksColumn {
  const column = columns.find((c) => c.name === name);
  if (!column) {
    throw new Error(`Column "${name}" was not found in the table.`);
  }
  return column;
}

function buildRowSource({
  columns,
  rows,
}: {
  columns: DatabricksColumn[];
  rows: Record<string, unknown>[];
}): DatabricksRowSource {
  const unknownKeys = [
    ...new Set(rows.flatMap((row) => Object.keys(row))),
  ].filter((key) => !columns.some((c) => c.name === key));
  if (unknownKeys.length > 0) {
    throw new Error(
      `These fields are not columns of the table: ${unknownKeys.join(', ')}`
    );
  }
  const used = columns.filter((column) =>
    rows.some((row) => row[column.name] !== undefined)
  );
  if (used.length === 0) {
    throw new Error('Provide a value for at least one column.');
  }
  const schema = `ARRAY<STRUCT<${used
    .map((column) => `${quoteIdentifier({ name: column.name })}: STRING`)
    .join(', ')}>>`;
  const selectList = used
    .map((column) => {
      const name = quoteIdentifier({ name: column.name });
      return `${convertToColumnType({ column, expression: name })} AS ${name}`;
    })
    .join(', ');
  const payload = rows.map((row) =>
    Object.fromEntries(
      used.map((column) => [
        column.name,
        toParameterValue({ value: row[column.name] }) ?? null,
      ])
    )
  );
  return {
    sql: `SELECT ${selectList} FROM (SELECT inline(from_json(:rows, ${stringLiteral(
      { value: schema }
    )})))`,
    columnNames: used.map((column) => column.name),
    parameters: [{ name: 'rows', value: JSON.stringify(payload) }],
  };
}

export const databricksUtils = {
  quoteIdentifier,
  tableRef,
  stringLiteral,
  convertToColumnType,
  toParameterValue,
  compactRow,
  findColumn,
  buildRowSource,
};

const COMPLEX_TYPES = ['ARRAY', 'MAP', 'STRUCT'];
