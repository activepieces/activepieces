import type { Bind } from 'snowflake-sdk';

const SIMPLE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_$]*$/;
const QUOTED_IDENTIFIER = /^"(?:[^"]|"")+"$/;
const MAX_IDENTIFIER_LENGTH = 255;

export function identifier({
  name: raw,
  label = 'Identifier',
}: {
  name: string;
  label?: string;
}): string {
  const name = String(raw ?? '').trim();
  if (name === '') {
    throw new Error(`${label} is empty.`);
  }
  if (name.length > MAX_IDENTIFIER_LENGTH + 2) {
    throw new Error(
      `${label} is longer than ${MAX_IDENTIFIER_LENGTH} characters.`
    );
  }
  if (SIMPLE_IDENTIFIER.test(name) || QUOTED_IDENTIFIER.test(name)) {
    return name;
  }
  return quoteIdentifier(name);
}

export function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export function identifierValue(raw: string): string {
  const name = String(raw ?? '').trim();
  if (QUOTED_IDENTIFIER.test(name)) {
    return name.slice(1, -1).replace(/""/g, '"');
  }
  if (SIMPLE_IDENTIFIER.test(name)) {
    return name.toUpperCase();
  }
  return name;
}

export function splitQualifiedName(value: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === '"') {
      if (inQuotes && value[i + 1] === '"') {
        current += '""';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      current += char;
      continue;
    }
    if (char === '.' && !inQuotes) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (inQuotes) {
    throw new Error(`Name ${value} has an unclosed double quote.`);
  }
  parts.push(current.trim());
  return parts;
}

export function qualifiedName({
  value,
  maxParts = 3,
  label = 'Name',
}: {
  value: string;
  maxParts?: number;
  label?: string;
}): string {
  const raw = String(value ?? '').trim();
  if (raw === '') {
    throw new Error(`${label} is empty.`);
  }
  const parts = splitQualifiedName(raw);
  if (parts.length > maxParts || parts.some((part) => part === '')) {
    throw new Error(
      `${label} "${raw}" is not valid. Use up to ${maxParts} dot-separated parts, for example ${
        maxParts === 3 ? 'MY_DB.PUBLIC.ORDERS' : 'MY_DB.PUBLIC'
      }.`
    );
  }
  return parts.map((part) => identifier({ name: part, label })).join('.');
}

export function sqlString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

export function toBind(value: unknown): Bind {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`Value ${value} is not a finite number.`);
    }
    return value;
  }
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

export function isJsonValue(value: unknown): boolean {
  return (
    value !== null && typeof value === 'object' && !(value instanceof Date)
  );
}

export function valuePlaceholder(value: unknown): string {
  return isJsonValue(value) ? 'PARSE_JSON(?)' : '?';
}

export function parseObject({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): Record<string, unknown> {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`${label} must be a JSON object like {"NAME": "Alice"}.`);
    }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object like {"NAME": "Alice"}.`);
  }
  return Object.fromEntries(Object.entries(parsed));
}

export function parseRowArray({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): Record<string, unknown>[] {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`${label} must be a JSON array of objects.`);
    }
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON array of objects.`);
  }
  return parsed.map((item, index) =>
    parseObject({ value: item, label: `${label} item ${index + 1}` })
  );
}

export function parseStringList({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): string[] {
  let list: unknown[];
  if (Array.isArray(value)) {
    list = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        list = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        throw new Error(`${label} must be a list of names.`);
      }
    } else {
      list = trimmed === '' ? [] : trimmed.split(',');
    }
  } else {
    list = [];
  }
  return list.map((item) => String(item).trim()).filter((item) => item !== '');
}

export function boundedInteger({
  value,
  defaultValue,
  min,
  max,
  label,
}: {
  value: unknown;
  defaultValue: number;
  min: number;
  max: number;
  label: string;
}): number {
  if (value === undefined || value === null || value === '')
    return defaultValue;
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new Error(
      `${label} must be a whole number between ${min} and ${max}.`
    );
  }
  return num;
}

export function buildWhere(filtersInput: unknown): {
  clause: string;
  binds: Bind[];
} {
  const filters = parseFilters(filtersInput);
  if (filters.length === 0) {
    return { clause: '', binds: [] };
  }
  const binds: Bind[] = [];
  const conditions = filters.map((filter) => {
    const column = identifier({ name: filter.column, label: 'Filter column' });
    switch (filter.operator) {
      case 'IS NULL':
      case 'IS NOT NULL':
        return `${column} ${filter.operator}`;
      case 'IN':
      case 'NOT IN': {
        const values = filterValueList(filter.value);
        if (values.length === 0) {
          throw new Error(
            `Filter on ${filter.column} with ${filter.operator} needs at least one value.`
          );
        }
        values.forEach((item) => binds.push(toBind(item)));
        return `${column} ${filter.operator} (${values
          .map(() => '?')
          .join(', ')})`;
      }
      default: {
        if (filter.value === undefined || filter.value === null) {
          throw new Error(
            `Filter on ${filter.column} with ${filter.operator} needs a value. Use IS NULL to match empty values.`
          );
        }
        binds.push(toBind(filter.value));
        return `${column} ${filter.operator} ?`;
      }
    }
  });
  return { clause: ` WHERE ${conditions.join(' AND ')}`, binds };
}

export function parseFilters(input: unknown): Filter[] {
  let list: unknown = input;
  if (typeof input === 'string') {
    if (input.trim() === '') return [];
    try {
      list = JSON.parse(input);
    } catch {
      throw new Error(
        'Filters must be a list of {column, operator, value} objects.'
      );
    }
  }
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list)) {
    throw new Error(
      'Filters must be a list of {column, operator, value} objects.'
    );
  }
  return list.map((item, index) => {
    const entry = parseObject({ value: item, label: `Filter ${index + 1}` });
    const column = entry['column'];
    if (typeof column !== 'string' || column.trim() === '') {
      throw new Error(`Filter ${index + 1} needs a column name.`);
    }
    const operator = String(entry['operator'] ?? '=')
      .trim()
      .toUpperCase();
    if (!isFilterOperator(operator)) {
      throw new Error(
        `Filter ${
          index + 1
        } operator "${operator}" is not supported. Use one of: ${FILTER_OPERATORS.join(
          ', '
        )}.`
      );
    }
    return { column, operator, value: entry['value'] };
  });
}

export function buildOrderBy(input: unknown): string {
  let list: unknown = input;
  if (typeof input === 'string') {
    if (input.trim() === '') return '';
    try {
      list = JSON.parse(input);
    } catch {
      throw new Error('Sort must be a list of {column, direction} objects.');
    }
  }
  if (list === undefined || list === null) return '';
  if (!Array.isArray(list)) {
    throw new Error('Sort must be a list of {column, direction} objects.');
  }
  const parts = list.map((item, index) => {
    const entry = parseObject({ value: item, label: `Sort ${index + 1}` });
    const column = entry['column'];
    if (typeof column !== 'string' || column.trim() === '') {
      throw new Error(`Sort ${index + 1} needs a column name.`);
    }
    const direction = String(entry['direction'] ?? 'ASC')
      .trim()
      .toUpperCase();
    if (direction !== 'ASC' && direction !== 'DESC') {
      throw new Error(`Sort ${index + 1} direction must be ASC or DESC.`);
    }
    return `${identifier({ name: column, label: 'Sort column' })} ${direction}`;
  });
  return parts.length > 0 ? ` ORDER BY ${parts.join(', ')}` : '';
}

export function assertReadOnlyStatement(sql: string): string {
  const { code, body } = stripSql(sql);
  const words = code.toUpperCase().match(/[A-Z_][A-Z0-9_$]*/g) ?? [];
  const firstWord = words[0];
  if (firstWord === undefined) {
    throw new Error('The query is empty.');
  }
  if (!READ_ONLY_FIRST_WORDS.includes(firstWord)) {
    throw new Error(
      `Only read-only statements are allowed here (SELECT, WITH, SHOW, DESCRIBE, EXPLAIN); the query starts with ${firstWord}. Use the dedicated insert, update or delete actions to change data.`
    );
  }
  const blocked = words.find(
    (word) => BLOCKED_WORDS.has(word) || word.startsWith('SYSTEM$')
  );
  if (blocked) {
    throw new Error(
      `The query contains ${blocked}, which is not allowed in a read-only query.`
    );
  }
  return body;
}

export function firstKeyword(sql: string): string | undefined {
  const { code } = stripSql(sql);
  return code.toUpperCase().match(/[A-Z_][A-Z0-9_$]*/)?.[0];
}

function stripSql(sql: string): { code: string; body: string } {
  let code = '';
  let i = 0;
  let lastSignificant = -1;
  const text = sql;
  while (i < text.length) {
    const char = text.charAt(i);
    const next = text.charAt(i + 1);
    if ((char === '-' && next === '-') || (char === '/' && next === '/')) {
      while (i < text.length && text[i] !== '\n') i++;
      code += ' ';
      continue;
    }
    if (char === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2);
      if (end === -1) throw new Error('The query has an unclosed /* comment.');
      i = end + 2;
      code += ' ';
      continue;
    }
    if (char === "'") {
      i++;
      while (i < text.length) {
        if (text[i] === '\\') {
          i += 2;
          continue;
        }
        if (text[i] === "'") {
          if (text[i + 1] === "'") {
            i += 2;
            continue;
          }
          break;
        }
        i++;
      }
      if (i >= text.length)
        throw new Error('The query has an unclosed string literal.');
      i++;
      code += ' ? ';
      lastSignificant = i - 1;
      continue;
    }
    if (char === '"') {
      const end = text.indexOf('"', i + 1);
      if (end === -1)
        throw new Error('The query has an unclosed quoted identifier.');
      i = end + 1;
      code += ' x ';
      lastSignificant = i - 1;
      continue;
    }
    if (char === '$' && next === '$') {
      const end = text.indexOf('$$', i + 2);
      if (end === -1) throw new Error('The query has an unclosed $$ string.');
      i = end + 2;
      code += ' ? ';
      lastSignificant = i - 1;
      continue;
    }
    if (char === ';') {
      const rest = stripSqlTail(text.slice(i + 1));
      if (rest !== '') {
        throw new Error(
          'Only one statement is allowed; remove the extra statements after ";".'
        );
      }
      return { code, body: text.slice(0, lastSignificant + 1).trim() };
    }
    if (!/\s/.test(char)) lastSignificant = i;
    code += char;
    i++;
  }
  return { code, body: text.slice(0, lastSignificant + 1).trim() };
}

function stripSqlTail(rest: string): string {
  return rest
    .replace(/--[^\n]*/g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/[\s;]/g, '');
}

function filterValueList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return trimmed.split(',').map((item) => item.trim());
      }
    }
    return trimmed === '' ? [] : trimmed.split(',').map((item) => item.trim());
  }
  if (value === undefined || value === null) return [];
  return [value];
}

function isFilterOperator(value: string): value is FilterOperator {
  return FILTER_OPERATORS.some((operator) => operator === value);
}

const READ_ONLY_FIRST_WORDS = [
  'SELECT',
  'WITH',
  'SHOW',
  'DESCRIBE',
  'DESC',
  'EXPLAIN',
];

const BLOCKED_WORDS = new Set([
  'INSERT',
  'UPDATE',
  'DELETE',
  'MERGE',
  'CREATE',
  'DROP',
  'ALTER',
  'TRUNCATE',
  'GRANT',
  'REVOKE',
  'CALL',
  'COPY',
  'PUT',
  'REMOVE',
  'UNDROP',
  'USE',
  'EXECUTE',
  'BEGIN',
  'COMMIT',
  'ROLLBACK',
  'UNSET',
]);

export const FILTER_OPERATORS = [
  '=',
  '!=',
  '<',
  '<=',
  '>',
  '>=',
  'IN',
  'NOT IN',
  'LIKE',
  'ILIKE',
  'IS NULL',
  'IS NOT NULL',
] as const;

export type FilterOperator = (typeof FILTER_OPERATORS)[number];

export type Filter = {
  column: string;
  operator: FilterOperator;
  value: unknown;
};
