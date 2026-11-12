export function columnsQueryResult({
  rows,
  max,
}: {
  rows: Record<string, unknown>[];
  max: number;
}) {
  const items = rows.slice(0, max).map((row) => ({
    table_schema: row['TABLE_SCHEMA'] ?? null,
    table_name: row['TABLE_NAME'] ?? null,
    column_name: row['COLUMN_NAME'] ?? null,
    ordinal_position: row['ORDINAL_POSITION'] ?? null,
    data_type: row['DATA_TYPE'] ?? null,
    is_nullable: row['IS_NULLABLE'] ?? null,
    column_default: row['COLUMN_DEFAULT'] ?? null,
    comment: row['COMMENT'] ?? null,
  }));
  return { items, count: items.length, truncated: rows.length > max };
}
