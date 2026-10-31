import type { SurrealdbStatementResult, SurrealdbWhere } from './types';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toObject({ value, label }: { value: unknown; label: string }): Record<string, unknown> {
  if (!isObject(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value;
}

function buildWhere({ filters }: { filters: unknown }): SurrealdbWhere {
  if (filters === undefined || filters === null) {
    return { clause: '', vars: {} };
  }
  const conditions = Object.entries(toObject({ value: filters, label: 'Filters' })).flatMap(([field, condition]) =>
    isOperatorObject(condition)
      ? Object.entries(condition).map(([operator, value]) => ({ field, operator, value }))
      : [{ field, operator: '$eq', value: condition }],
  );
  const parts = conditions.map(({ field, operator, value }, index) => conditionToSql({ field, operator, value, index }));
  if (parts.length === 0) {
    return { clause: '', vars: {} };
  }
  return {
    clause: ` WHERE ${parts.map((part) => part.sql).join(' AND ')}`,
    vars: parts.reduce<Record<string, unknown>>((all, part) => ({ ...all, ...part.vars }), {}),
  };
}

function boundedInteger({ value, defaultValue, min, max, label }: { value: number | undefined; defaultValue: number; min: number; max: number; label: string }): number {
  const resolved = value ?? defaultValue;
  if (!Number.isInteger(resolved) || resolved < min || resolved > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  }
  return resolved;
}

function fieldPath({ field, label }: { field: string; label: string }): string {
  if (!FIELD_PATH.test(field)) {
    throw new Error(`${label} "${field}" is not a valid field path. Use letters, digits and underscores, with dots for nested fields (e.g. "address.city").`);
  }
  return field;
}

function singleRecord({ records, recordId }: { records: Record<string, unknown>[]; recordId: string }): Record<string, unknown> {
  const [record] = records;
  if (record === undefined) {
    throw new Error(`Record "${recordId}" was not found. Record ids look like "table:id"; Find Records returns them.`);
  }
  return record;
}

function lastStatementResult<T>({ statements }: { statements: SurrealdbStatementResult<T>[] }): T {
  const failures = statements.filter((statement) => statement.status === 'ERR');
  if (failures.length > 0) {
    const causes = failures.filter((statement) => !FOLLOW_ON_ERRORS.includes(statement.details?.kind ?? ''));
    throw new Error(`SurrealDB error: ${(causes.length > 0 ? causes : failures).map((statement) => String(statement.result)).join('; ')}`);
  }
  const last = statements[statements.length - 1];
  if (!last) {
    throw new Error('SurrealDB returned no result.');
  }
  return last.result;
}

function isOperatorObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) {
    return false;
  }
  const keys = Object.keys(value);
  const isCast = keys.length === 1 && Object.keys(CASTS).includes(keys[0]);
  return !isCast && keys.some((key) => key.startsWith('$'));
}

function conditionToSql({ field, operator, value, index }: { field: string; operator: string; value: unknown; index: number }): { sql: string; vars: Record<string, unknown> } {
  const fieldVar = `ap_f${index}`;
  const valueVar = `ap_v${index}`;
  const target = `type::field($${fieldVar})`;
  if (operator === '$exists') {
    if (typeof value !== 'boolean') {
      throw new Error(`Filter on "${field}": $exists takes true or false.`);
    }
    return { sql: `${target} ${value ? '!=' : '='} NONE`, vars: { [fieldVar]: field } };
  }
  const sqlOperator = Object.keys(OPERATORS).includes(operator) ? OPERATORS[operator] : undefined;
  if (sqlOperator === undefined) {
    throw new Error(`Filter on "${field}": operator "${operator}" is not supported. Use one of: ${Object.keys(OPERATORS).join(', ')}.`);
  }
  const typed = typedValue({ value });
  return {
    sql: `${target} ${sqlOperator} ${typed.cast}$${valueVar}`,
    vars: { [fieldVar]: field, [valueVar]: typed.value },
  };
}

function typedValue({ value }: { value: unknown }): { cast: string; value: unknown } {
  if (isObject(value) && Object.keys(value).length === 1) {
    const [key] = Object.keys(value);
    if (Object.keys(CASTS).includes(key)) {
      return { cast: CASTS[key], value: value[key] };
    }
  }
  return { cast: '', value };
}

export const surrealdbUtils = { toObject, buildWhere, boundedInteger, fieldPath, isObject, singleRecord, lastStatementResult };

const FOLLOW_ON_ERRORS = ['NotExecuted', 'Cancelled'];

const FIELD_PATH = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/;

const OPERATORS: Record<string, string> = {
  $eq: '=',
  $ne: '!=',
  $gt: '>',
  $gte: '>=',
  $lt: '<',
  $lte: '<=',
  $in: 'INSIDE',
  $nin: 'NOTINSIDE',
  $contains: 'CONTAINS',
  $containsNot: 'CONTAINSNOT',
  $containsAny: 'CONTAINSANY',
  $containsAll: 'CONTAINSALL',
  $exists: '',
};

const CASTS: Record<string, string> = {
  $record: '<record>',
  $datetime: '<datetime>',
  $decimal: '<decimal>',
  $uuid: '<uuid>',
  $duration: '<duration>',
};
