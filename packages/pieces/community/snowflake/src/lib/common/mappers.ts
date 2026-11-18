import { normaliseTimestamp } from './operations';

export function mapTable(row: Record<string, unknown>) {
  return {
    table_name: row['name'] ?? null,
    database_name: row['database_name'] ?? null,
    schema_name: row['schema_name'] ?? null,
    kind: row['kind'] ?? null,
    rows: row['rows'] ?? null,
    bytes: row['bytes'] ?? null,
    owner: row['owner'] ?? null,
    comment: row['comment'] ?? null,
    created_on: normaliseTimestamp(row['created_on']),
  };
}

export function mapView(row: Record<string, unknown>) {
  return {
    view_name: row['name'] ?? null,
    database_name: row['database_name'] ?? null,
    schema_name: row['schema_name'] ?? null,
    owner: row['owner'] ?? null,
    comment: row['comment'] ?? null,
    text: row['text'] ?? null,
    is_secure: row['is_secure'] ?? null,
    is_materialized: row['is_materialized'] ?? null,
    created_on: normaliseTimestamp(row['created_on']),
  };
}

export function mapCopyFile(row: Record<string, unknown>) {
  return {
    file: row['file'] ?? null,
    status: row['status'] ?? null,
    rows_parsed: row['rows_parsed'] ?? null,
    rows_loaded: row['rows_loaded'] ?? null,
    error_limit: row['error_limit'] ?? null,
    errors_seen: row['errors_seen'] ?? null,
    first_error: row['first_error'] ?? null,
  };
}
