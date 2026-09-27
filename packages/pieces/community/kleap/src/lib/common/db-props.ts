import { HttpMethod } from '@activepieces/pieces-common';
import { InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { kleapAuth } from '../auth';
import { JsonObject, KleapAuthValue, kleapRequest, parseJsonInput, resolveAppId } from './client';

/* Database fields a non-technical user can fill: one field per column, conditions as
 * "column" dropdown + "value", never raw JSON (an optional advanced JSON field is only extra). */

export interface KleapColumn {
  name: string;
  type: string;
  nullable?: boolean;
  default?: unknown;
  primary_key?: boolean;
}

export async function fetchColumns(auth: KleapAuthValue, appIdInput: unknown, table: unknown): Promise<KleapColumn[]> {
  const appId = await resolveAppId(auth, appIdInput);
  const schema = await kleapRequest<{ tables?: { name: string; columns?: KleapColumn[] }[] }>(
    auth,
    HttpMethod.GET,
    `/apps/${appId}/database`,
  );
  const found = (schema.tables ?? []).find((t) => t.name === String(table));
  if (!found) throw new Error(`Table "${table}" not found in this app's database.`);
  return found.columns ?? [];
}

type ColumnKind = 'number' | 'boolean' | 'datetime' | 'json' | 'text';

export function columnKind(type: string): ColumnKind {
  const t = String(type ?? '').toLowerCase();
  if (/^(smallint|integer|bigint|int\d?|numeric|decimal|real|double precision|float\d?|smallserial|serial|bigserial)/.test(t)) return 'number';
  if (t === 'boolean' || t === 'bool') return 'boolean';
  if (/^(timestamp|date|time)/.test(t)) return 'datetime';
  if (t === 'json' || t === 'jsonb') return 'json';
  return 'text';
}

const YES_NO = { options: [{ label: 'Yes (true)', value: 'true' }, { label: 'No (false)', value: 'false' }] };

/** One input per column. mode "insert": required when NOT NULL without default; "set": all optional. */
function columnInputs(columns: KleapColumn[], mode: 'insert' | 'set'): InputPropertyMap {
  const props: Record<string, unknown> = {};
  for (const col of columns) {
    const hasDefault = col.default !== null && col.default !== undefined && col.default !== '';
    const required = mode === 'insert' && col.nullable === false && !hasDefault;
    const hint =
      mode === 'insert'
        ? hasDefault
          ? `Optional (${col.type}). Leave empty to use the default.`
          : required
            ? `Required (${col.type}).`
            : `Optional (${col.type}).`
        : `New value (${col.type}). Leave empty to keep the current value.`;
    const base = { displayName: col.name, description: hint, required };
    switch (columnKind(col.type)) {
      case 'number':
        props[col.name] = Property.Number(base);
        break;
      case 'boolean':
        props[col.name] = Property.StaticDropdown({ ...base, options: YES_NO });
        break;
      case 'datetime':
        props[col.name] = Property.DateTime(base);
        break;
      case 'json':
        props[col.name] = Property.LongText({ ...base, description: `${hint} JSON value.` });
        break;
      default:
        props[col.name] = Property.ShortText(base);
    }
  }
  return props as InputPropertyMap;
}

export const columnValuesProp = (mode: 'insert' | 'set') =>
  Property.DynamicProperties({
    auth: kleapAuth,
    displayName: mode === 'insert' ? 'Values' : 'New Values',
    description:
      mode === 'insert'
        ? 'One field per column of the table. Map values from previous steps.'
        : 'Fill only the columns you want to change.',
    required: mode === 'insert',
    refreshers: ['app_id', 'table'],
    props: async ({ auth, app_id, table }) => {
      if (!auth || !app_id || !table) return {};
      try {
        return columnInputs(await fetchColumns(auth, app_id, table), mode);
      } catch {
        return {};
      }
    },
  });

/** Column picker, refreshed with the app and the table. */
export const columnDropdown = (options: { displayName: string; description: string; required?: boolean }) =>
  Property.Dropdown({
    auth: kleapAuth,
    displayName: options.displayName,
    description: options.description,
    required: options.required ?? false,
    refreshers: ['app_id', 'table'],
    options: async ({ auth, app_id, table }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Connect your Kleap account first' };
      if (!app_id || !table) return { disabled: true, options: [], placeholder: 'Select an app and a table first' };
      try {
        const columns = await fetchColumns(auth, app_id, table);
        return {
          disabled: false,
          options: columns.map((c) => ({ label: `${c.name} (${c.type})`, value: c.name })),
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: (error as Error).message };
      }
    },
  });

/** "Where" as column + value, plus an optional advanced JSON for several conditions. */
export const whereProps = (required: boolean) => ({
  where_column: columnDropdown({
    displayName: required ? 'Match Column' : 'Filter Column',
    description: required
      ? 'Rows whose value in this column equals "Match Value" are affected (e.g. id or email).'
      : 'Optional: only return rows whose value in this column equals "Filter Value".',
    required,
  }),
  where_value: Property.ShortText({
    displayName: required ? 'Match Value' : 'Filter Value',
    description: 'The value to look for, e.g. 42 or ada@example.com.',
    required,
  }),
  where_advanced: Property.Json({
    displayName: 'More Conditions (Advanced, Optional)',
    description: 'Only if you need several conditions: extra column equalities, e.g. {"status": "new"}.',
    required: false,
  }),
});

export function coerceValue(value: unknown, column?: KleapColumn): unknown {
  if (value === undefined || value === null) return value;
  const kind = column ? columnKind(column.type) : 'text';
  if (kind === 'number' && typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  if (kind === 'boolean' && typeof value === 'string') {
    if (/^(true|yes|1)$/i.test(value)) return true;
    if (/^(false|no|0)$/i.test(value)) return false;
  }
  if (kind === 'json' && typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

/** Keeps the filled fields only, typed after their column. */
export function collectValues(values: unknown, columns: KleapColumn[]): JsonObject {
  const out: JsonObject = {};
  const byName = new Map(columns.map((c) => [c.name, c]));
  for (const [key, value] of Object.entries((values as JsonObject | undefined) ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = coerceValue(value, byName.get(key));
  }
  return out;
}

export function buildWhere(
  p: { where_column?: unknown; where_value?: unknown; where_advanced?: unknown },
  columns: KleapColumn[],
): JsonObject {
  const where: JsonObject = {};
  const column = typeof p.where_column === 'string' ? p.where_column.trim() : '';
  if (column && p.where_value !== undefined && p.where_value !== null && p.where_value !== '') {
    where[column] = coerceValue(p.where_value, columns.find((c) => c.name === column));
  }
  const advanced = parseJsonInput<JsonObject>(p.where_advanced, 'More Conditions');
  if (advanced !== undefined) {
    if (typeof advanced !== 'object' || Array.isArray(advanced)) {
      throw new Error('"More Conditions" must be a JSON object like {"status": "new"}.');
    }
    Object.assign(where, advanced);
  }
  return where;
}
