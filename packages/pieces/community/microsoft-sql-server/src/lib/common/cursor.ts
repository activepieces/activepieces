import { isNil } from '@activepieces/pieces-framework';
import sql from 'mssql';
import {
  MssqlColumn,
  MssqlTable,
  MssqlTableMeta,
  mssqlCommon,
} from '.';

const DATE_TYPES = new Set([
  'datetime2',
  'datetime',
  'smalldatetime',
  'date',
  'time',
]);
const BINARY_TYPES = new Set(['binary', 'varbinary', 'timestamp']);
const FLOAT_TYPES = new Set(['float', 'real']);
const MONEY_TYPES = new Set(['money', 'smallmoney']);
const STRING_TYPES = new Set(['char', 'varchar', 'nchar', 'nvarchar']);

const ISO = 126;
const HEX = 1;
const FLOAT_FULL = 3;
const MONEY_FULL = 2;

const RERENDERED_AT_LAYOUT: Record<number, Set<string>> = {
  2: new Set(['datetimeoffset']),
};

const CURSOR_TYPES = new Set([
  ...DATE_TYPES,
  ...BINARY_TYPES,
  ...FLOAT_TYPES,
  ...STRING_TYPES,
  'datetimeoffset',
  'bit',
  'tinyint',
  'smallint',
  'int',
  'bigint',
  'decimal',
  'numeric',
  'money',
  'smallmoney',
  'uniqueidentifier',
]);

const EXACT_TEXT_TYPES = new Set([
  'decimal',
  'numeric',
  'money',
  'smallmoney',
  'datetime2',
  'datetimeoffset',
  'datetime',
  'smalldatetime',
  'time',
  'date',
]);

function isCursorType(column: MssqlColumn): boolean {
  return CURSOR_TYPES.has(column.type);
}

function isTiebreakType(column: MssqlColumn): boolean {
  return isCursorType(column) && column.maxLength !== -1;
}

function isGroupableOrderType(column: MssqlColumn): boolean {
  return isCursorType(column) && !STRING_TYPES.has(column.type);
}

function declaredType(column: MssqlColumn): string {
  const { type, precision, scale, maxLength } = column;
  if (!isCursorType(column)) {
    throw new Error(
      `Ordering by a ${type} column is not supported, because its values cannot be saved as a polling position.`
    );
  }
  switch (type) {
    case 'datetime2':
    case 'datetimeoffset':
    case 'time':
      return `${type}(${scale})`;
    case 'decimal':
    case 'numeric':
      return `${type}(${precision},${scale})`;
    case 'timestamp':
      return 'binary(8)';
    case 'binary':
    case 'varbinary':
    case 'char':
    case 'varchar':
      return maxLength === -1 ? `${type}(max)` : `${type}(${maxLength})`;
    case 'nchar':
    case 'nvarchar':
      return maxLength === -1 ? `${type}(max)` : `${type}(${maxLength / 2})`;
    default:
      return type;
  }
}

function outStyle(column: MssqlColumn): number | undefined {
  if (column.type === 'datetimeoffset') return ISO;
  if (DATE_TYPES.has(column.type)) return ISO;
  if (BINARY_TYPES.has(column.type)) return HEX;
  if (FLOAT_TYPES.has(column.type)) return FLOAT_FULL;
  if (MONEY_TYPES.has(column.type)) return MONEY_FULL;
  return undefined;
}

function inStyle(column: MssqlColumn): number | undefined {
  if (column.type === 'datetimeoffset') return ISO;
  if (DATE_TYPES.has(column.type)) return ISO;
  if (BINARY_TYPES.has(column.type)) return HEX;
  return undefined;
}

function cursorText(column: MssqlColumn): string {
  const style = outStyle(column);
  if (style === undefined) {
    return `CONVERT(nvarchar(max), ${mssqlCommon.quoteId(column.name)})`;
  }
  const source = BINARY_TYPES.has(column.type)
    ? `CONVERT(${declaredType(column)}, ${mssqlCommon.quoteId(column.name)})`
    : mssqlCommon.quoteId(column.name);
  return `CONVERT(varchar(max), ${source}, ${style})`;
}

function exactColumn({
  column,
  prefix,
}: {
  column: MssqlColumn;
  prefix?: string;
}): string {
  const id = prefix
    ? `${prefix}.${mssqlCommon.quoteId(column.name)}`
    : mssqlCommon.quoteId(column.name);
  if (!EXACT_TEXT_TYPES.has(column.type)) return id;
  const style = outStyle(column);
  const converted = `CONVERT(varchar(max), ${id}${
    style === undefined ? '' : `, ${style}`
  })`;
  return `${converted} AS ${mssqlCommon.quoteId(column.name)}`;
}

function exactProjection({
  columns,
  prefix,
}: {
  columns: MssqlColumn[];
  prefix?: string;
}): string {
  if (columns.length === 0) return prefix ? `${prefix}.*` : '*';
  return columns.map((column) => exactColumn({ column, prefix })).join(', ');
}

function cursorShape(column: MssqlColumn): string {
  return `${column.name}:${declaredType(column)}`;
}

function cursorBind({
  column,
  parameter,
}: {
  column: MssqlColumn;
  parameter: string;
}): string {
  const target = declaredType(column);
  const style = inStyle(column);
  const source =
    STRING_TYPES.has(column.type) && !isNil(column.collation)
      ? `${parameter} COLLATE ${column.collation}`
      : parameter;
  return style === undefined
    ? `CONVERT(${target}, ${source})`
    : `CONVERT(${target}, ${source}, ${style})`;
}

function cursorParamType(column: MssqlColumn): sql.ISqlType {
  return outStyle(column) === undefined
    ? sql.NVarChar(sql.MAX)
    : sql.VarChar(sql.MAX);
}

function bindCursorValues({
  request,
  columns,
  values,
}: {
  request: sql.Request;
  columns: readonly MssqlColumn[];
  values: readonly string[];
}): void {
  values.forEach((value, index) => {
    request.input(`p${index}`, cursorParamType(columns[index]), value);
  });
}

function keyPlan({
  meta,
  orderBy,
}: {
  meta: MssqlTableMeta;
  orderBy: string;
}): { keyed: boolean; tiebreakers: MssqlColumn[] } {
  const byName = new Map(meta.columns.map((column) => [column.name, column]));
  const keyNames = meta.identity ? [meta.identity] : meta.keyColumns;
  const tiebreakers: MssqlColumn[] = [];
  let keyed = keyNames.length > 0;
  for (const name of keyNames) {
    if (name === orderBy) continue;
    const column = byName.get(name);
    if (isNil(column) || !isTiebreakType(column)) {
      keyed = false;
      break;
    }
    tiebreakers.push(column);
  }
  return { keyed, tiebreakers };
}

function isOrderable({
  meta,
  column,
}: {
  meta: MssqlTableMeta;
  column: MssqlColumn;
}): boolean {
  if (!isTiebreakType(column)) return false;
  return (
    keyPlan({ meta, orderBy: column.name }).keyed ||
    isGroupableOrderType(column)
  );
}

function planCursor({
  meta,
  propsValue,
}: {
  meta: MssqlTableMeta;
  propsValue: {
    table: MssqlTable;
    order_by: string;
    order_direction: OrderDirection | undefined;
  };
}): Plan {
  const { table, order_by, order_direction } = propsValue;
  if (order_direction !== 'ASC' && order_direction !== 'DESC') {
    throw new Error(
      `Invalid order direction: ${JSON.stringify(order_direction)}`
    );
  }

  const byName = new Map(meta.columns.map((column) => [column.name, column]));
  const qualified = `${table.table_schema}.${table.table_name}`;

  const order = byName.get(order_by);
  if (isNil(order)) {
    throw new Error(`The column "${order_by}" no longer exists on ${qualified}.`);
  }
  if (!isCursorType(order)) {
    throw new Error(
      `Ordering by a ${order.type} column is not supported, because its values cannot be saved as a polling position. Order by a timestamp, a number, or an identity column instead.`
    );
  }
  if (meta.columns.some((column) => column.name.startsWith(ALIAS))) {
    throw new Error(
      `${qualified} has a column whose name starts with "${ALIAS}", which this trigger reserves for its own bookkeeping. Rename that column to use the trigger.`
    );
  }

  const { keyed, tiebreakers } = keyPlan({ meta, orderBy: order_by });

  if (!keyed && !isGroupableOrderType(order)) {
    throw new Error(
      `${qualified} has no primary key or unique constraint, so rows sharing a "${order_by}" value have to be grouped by that value — which a ${order.type} column cannot be grouped by reliably. Add a key to the table, or order by a timestamp or a number.`
    );
  }

  return {
    mode: keyed ? 'keyset' : 'group',
    columns: keyed ? [order, ...tiebreakers] : [order],
    all: meta.columns,
    target: mssqlCommon.quoteTable(table),
    drain: order_direction === 'DESC' ? 'ASC' : 'DESC',
    ahead: order_direction === 'DESC' ? '>' : '<',
  };
}

function alias(index: number): string {
  return `${ALIAS}${index}`;
}

function positionProjection(columns: MssqlColumn[]): string {
  return columns
    .map((column, index) => `${cursorText(column)} AS ${mssqlCommon.quoteId(alias(index))}`)
    .join(', ');
}

function orderClause({
  plan,
  direction,
}: {
  plan: Plan;
  direction: OrderDirection;
}): string {
  return plan.columns
    .map((column) => `${plan.target}.${mssqlCommon.quoteId(column.name)} ${direction}`)
    .join(', ');
}

function notNullClause(plan: Plan): string {
  return `${mssqlCommon.quoteId(plan.columns[0].name)} IS NOT NULL`;
}

function headDirection(plan: Plan): OrderDirection {
  return plan.drain === 'ASC' ? 'DESC' : 'ASC';
}

function keysetAhead(plan: Plan): string {
  const terms = plan.columns.map((column, index) => {
    const equal = plan.columns
      .slice(0, index)
      .map(
        (prior, position) =>
          `${mssqlCommon.quoteId(prior.name)} = ${cursorBind({
            column: prior,
            parameter: `@p${position}`,
          })}`
      );
    const ahead = `${mssqlCommon.quoteId(column.name)} ${plan.ahead} ${cursorBind({
      column,
      parameter: `@p${index}`,
    })}`;
    return `(${[...equal, ahead].join(' AND ')})`;
  });
  return `(${terms.join(' OR ')})`;
}

function projection(plan: Plan): string {
  return `${exactProjection({ columns: plan.all })}, ${positionProjection(
    plan.columns
  )}`;
}

function drainPage({ plan, where }: { plan: Plan; where: string[] }): string {
  return `SELECT TOP (@limit) ${projection(plan)} FROM ${
    plan.target
  } WHERE ${where.join(' AND ')} ORDER BY ${orderClause({
    plan,
    direction: plan.drain,
  })}`;
}

function keysetPageQuery({
  plan,
  position,
}: {
  plan: Plan;
  position: string[] | null;
}): string {
  const where = [notNullClause(plan)];
  if (position) {
    where.push(keysetAhead(plan));
  }
  return drainPage({ plan, where });
}

function groupPageQuery({
  plan,
  position,
}: {
  plan: Plan;
  position: string[] | null;
}): string {
  const where = [notNullClause(plan)];
  if (position) {
    where.push(
      `${mssqlCommon.quoteId(plan.columns[0].name)} ${plan.ahead} ${cursorBind({
        column: plan.columns[0],
        parameter: '@p0',
      })}`
    );
  }
  return drainPage({ plan, where });
}

function groupValueQuery(plan: Plan): string {
  return `SELECT TOP (@limit) ${projection(plan)} FROM ${
    plan.target
  } WHERE ${mssqlCommon.quoteId(plan.columns[0].name)} = ${cursorBind({
    column: plan.columns[0],
    parameter: '@p0',
  })}`;
}

function baselineQuery(plan: Plan): string {
  return `SELECT TOP (1) ${positionProjection(
    plan.columns
  )} FROM ${plan.target} WHERE ${notNullClause(plan)} ORDER BY ${orderClause({
    plan,
    direction: headDirection(plan),
  })}`;
}

function previewQuery(plan: Plan): string {
  return `SELECT TOP (@limit) ${exactProjection({
    columns: plan.all,
  })} FROM ${plan.target} WHERE ${notNullClause(plan)} ORDER BY ${orderClause({
    plan,
    direction: headDirection(plan),
  })}`;
}

function positionOf({
  plan,
  row,
}: {
  plan: Plan;
  row: Record<string, unknown>;
}): string[] {
  return plan.columns.map((column, index) => {
    const value = row[alias(index)];
    if (isNil(value)) {
      throw new Error(
        `Could not read a polling position from the column "${column.name}".`
      );
    }
    return String(value);
  });
}

function completeGroups<T extends Record<string, unknown>>({
  plan,
  rows,
  limit,
}: {
  plan: Plan;
  rows: T[];
  limit: number;
}): { ready: T[]; oversized: string | null } {
  if (rows.length <= limit) {
    return { ready: rows, oversized: null };
  }
  const trailing = positionOf({ plan, row: rows[rows.length - 1] })[0];
  const ready = rows.filter(
    (row) => positionOf({ plan, row })[0] !== trailing
  );
  return ready.length > 0
    ? { ready, oversized: null }
    : { ready: [], oversized: trailing };
}

function stripPosition({
  plan,
  row,
}: {
  plan: Plan;
  row: Record<string, unknown>;
}): Record<string, unknown> {
  const data = { ...row };
  plan.columns.forEach((_, index) => delete data[alias(index)]);
  return data;
}

function newCursor({
  plan,
  position,
}: {
  plan: Plan;
  position: string[] | null;
}): Cursor {
  return {
    v: CURSOR_LAYOUT,
    m: plan.mode,
    c: plan.columns.map(cursorShape),
    k: position,
  };
}

function isCompatibleLayout({
  layout,
  columns,
  position,
}: {
  layout: number;
  columns: MssqlColumn[];
  position: string[] | null;
}): boolean {
  if (layout === CURSOR_LAYOUT) return true;
  if (!Number.isInteger(layout) || layout < 1 || layout > CURSOR_LAYOUT) {
    return false;
  }
  if (isNil(position)) return true;
  for (let step = layout + 1; step <= CURSOR_LAYOUT; step++) {
    const rerendered = RERENDERED_AT_LAYOUT[step];
    if (isNil(rerendered)) return false;
    if (columns.some((column) => rerendered.has(column.type))) return false;
  }
  return true;
}

function reconcile({
  stored,
  plan,
}: {
  stored: Cursor | null;
  plan: Plan;
}): Cursor | null {
  if (isNil(stored)) return null;
  const shape = plan.columns.map(cursorShape);
  const matches =
    isCompatibleLayout({
      layout: stored.v,
      columns: plan.columns,
      position: stored.k,
    }) &&
    stored.m === plan.mode &&
    Array.isArray(stored.c) &&
    stored.c.length === shape.length &&
    stored.c.every((entry, index) => entry === shape[index]) &&
    (stored.k === null ||
      (Array.isArray(stored.k) &&
        stored.k.length === shape.length &&
        stored.k.every((value) => typeof value === 'string')));
  return matches ? stored : null;
}

export const cursorUtils = {
  isTiebreakType,
  isOrderable,
  declaredType,
  cursorText,
  cursorBind,
  cursorParamType,
  bindCursorValues,
  exactColumn,
  exactProjection,
  planCursor,
  alias,
  keysetPageQuery,
  groupPageQuery,
  groupValueQuery,
  baselineQuery,
  previewQuery,
  completeGroups,
  positionOf,
  stripPosition,
  newCursor,
  reconcile,
};

export const CURSOR_LAYOUT = 2;

export const ALIAS = '__ap_cursor_';

export type OrderDirection = 'ASC' | 'DESC';

export type Mode = 'keyset' | 'group';

export type Cursor = {
  v: number;
  m: Mode;
  c: string[];
  k: string[] | null;
};

export type Plan = {
  mode: Mode;
  columns: MssqlColumn[];
  all: MssqlColumn[];
  target: string;
  drain: OrderDirection;
  ahead: '>' | '<';
};
