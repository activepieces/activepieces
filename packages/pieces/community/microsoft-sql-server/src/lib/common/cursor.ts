import { isNil } from '@activepieces/pieces-framework';
import sql from 'mssql';
import {
  MssqlColumn,
  MssqlTable,
  MssqlTableMeta,
  quoteId,
  quoteTable,
} from '.';

/**
 * A polling cursor has to survive the round trip through the store byte for
 * byte, and reading it as a JavaScript value does not manage that: node-mssql
 * hands back a Date for datetime2(7), and Date holds only milliseconds, so the
 * saved position lands up to 999,999 ticks below the row it describes. A strict
 * comparison then re-matches that row on every poll and the trigger redelivers
 * it forever. bigint has the same problem above 2^53, where the driver's Number
 * silently rounds.
 *
 * So no cursor value ever passes through a JavaScript number or Date. The server
 * renders it as text with a style chosen for exact round-tripping, and the
 * comparison converts that text straight back to the column's declared type.
 */

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

// 126/127 are ISO 8601 keeping every fractional digit, 1 renders binary with the
// 0x prefix, 3 prints a float to the 17 digits a double needs, and 2 prints all
// four of money's decimal places -- its default rendering shows only two, so
// 0.0001 would come back as 0.00 and the position would never advance.
const ISO = 126;
const ISO_OFFSET = 127;
const HEX = 1;
const FLOAT_FULL = 3;
const MONEY_FULL = 2;

/** types whose values survive the text round trip exactly */
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

export function isCursorType(column: MssqlColumn): boolean {
  return CURSOR_TYPES.has(column.type);
}

/**
 * A keyset tiebreaker needs more than a lossless round trip: it has to impose a
 * total order, so that a strict comparison never steps past two rows at once.
 * A string column looks like a counter-example, since a case- or
 * accent-insensitive collation makes distinct values compare equal and trailing
 * spaces are ignored -- but tiebreakers only ever come from an enforced unique
 * index, and that index enforces uniqueness under the very collation the
 * comparison uses. Two rows that compared equal could not both exist. So the
 * only exclusion left is a max type, which ORDER BY rejects outright (and which
 * cannot be an index key anyway).
 */
export function isTiebreakType(column: MssqlColumn): boolean {
  return isCursorType(column) && column.maxLength !== -1;
}

/**
 * Group mode decides where one ordering value ends by comparing rendered text,
 * so it needs text equality to mean value equality. That holds for every exact
 * type, and fails for strings: a case-insensitive collation treats 'a' and 'A'
 * as one value while they render as two, and nothing here enforces uniqueness
 * on an ordering column to rule that out.
 */
export function isGroupableOrderType(column: MssqlColumn): boolean {
  return isCursorType(column) && !STRING_TYPES.has(column.type);
}

/** the column's declared type, as a CONVERT target */
export function declaredType(column: MssqlColumn): string {
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
    // rowversion reports as timestamp, which is not a legal CONVERT target
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

/** the style that renders the value without losing anything */
function outStyle(column: MssqlColumn): number | undefined {
  if (column.type === 'datetimeoffset') return ISO_OFFSET;
  if (DATE_TYPES.has(column.type)) return ISO;
  if (BINARY_TYPES.has(column.type)) return HEX;
  if (FLOAT_TYPES.has(column.type)) return FLOAT_FULL;
  if (MONEY_TYPES.has(column.type)) return MONEY_FULL;
  return undefined;
}

/**
 * The style needed to read that text back. Only the date and binary families
 * care: a date needs to be told the layout is ISO, and hex digits are read as
 * characters unless style 1 says otherwise. Going back to a number, CONVERT
 * ignores the style altogether, so passing one would be noise.
 */
function inStyle(column: MssqlColumn): number | undefined {
  if (column.type === 'datetimeoffset') return ISO_OFFSET;
  if (DATE_TYPES.has(column.type)) return ISO;
  if (BINARY_TYPES.has(column.type)) return HEX;
  return undefined;
}

/**
 * SQL that renders the column's value as losslessly recoverable text.
 *
 * A styled rendering is always plain ASCII -- an ISO timestamp, hex digits, a
 * float's decimal digits -- so it travels as varchar. Anything else stays
 * nvarchar, since a text column's value may be Unicode. The parameter type has
 * to agree, because SQL Server will not parse an nvarchar as hex bytes.
 */
export function cursorText(column: MssqlColumn): string {
  const style = outStyle(column);
  if (style === undefined) {
    return `CONVERT(nvarchar(max), ${quoteId(column.name)})`;
  }
  // A rowversion column silently ignores the hex style and hands back its raw
  // bytes as characters -- which contain NULs, so the value arrives truncated.
  // Casting to the plain binary type first makes the style apply. Harmless for
  // the other binary types, where the inner cast is a no-op.
  const source = BINARY_TYPES.has(column.type)
    ? `CONVERT(${declaredType(column)}, ${quoteId(column.name)})`
    : quoteId(column.name);
  return `CONVERT(varchar(max), ${source}, ${style})`;
}

/** SQL that turns that text back into a value comparable against the column */
export function cursorBind(column: MssqlColumn, parameter: string): string {
  const target = declaredType(column);
  const style = inStyle(column);
  return style === undefined
    ? `CONVERT(${target}, ${parameter})`
    : `CONVERT(${target}, ${parameter}, ${style})`;
}

/** the parameter type that matches how cursorText rendered the value */
export function cursorParamType(column: MssqlColumn): sql.ISqlType {
  return outStyle(column) === undefined
    ? sql.NVarChar(sql.MAX)
    : sql.VarChar(sql.MAX);
}

export function bindCursorValues(
  request: sql.Request,
  columns: readonly MssqlColumn[],
  values: readonly string[]
): void {
  values.forEach((value, index) => {
    request.input(`p${index}`, cursorParamType(columns[index]), value);
  });
}

export type OrderDirection = 'ASC' | 'DESC';

export type Mode = 'keyset' | 'group';

// bump to make every live trigger discard its position and re-baseline
export const CURSOR_LAYOUT = 1;

// reserved for the position columns a page query projects alongside the row
export const ALIAS = '__ap_cursor_';

/**
 * Where a trigger has got to.
 *
 * `k` is the position, held as the lossless text the server rendered rather than
 * as a JavaScript value, and `null` means nothing has been delivered yet, so the
 * drain starts at the very first row. `c` records the columns the position was
 * rendered from: binding saved values against different columns would compare
 * nonsense, so a shape change re-baselines instead.
 */
export type Cursor = {
  v: number;
  m: Mode;
  c: string[];
  k: string[] | null;
};

export type Plan = {
  mode: Mode;
  /** the ordering column first, then the tiebreakers; a position mirrors this */
  columns: MssqlColumn[];
  target: string;
  /** the direction the drain walks, which is the reverse of how the table reads */
  drain: OrderDirection;
  /** the comparison that means "past the position" */
  ahead: '>' | '<';
};

export function planCursor(
  meta: MssqlTableMeta,
  propsValue: {
    table: MssqlTable;
    order_by: string;
    order_direction: OrderDirection | undefined;
  }
): Plan {
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

  // A row is identifiable by its ordering value plus something unique, and that
  // something has to be immutable to be worth trusting. An IDENTITY column is
  // both, and it is ascending as well, so a row inserted later always sorts
  // ahead of the position. A declared key is unique but editable, which makes an
  // edited row look new once. Anything else -- no key at all, or a key on a type
  // with no total order under plain comparison -- drops to group mode.
  const keyNames = meta.identity ? [meta.identity] : meta.keyColumns;
  const tiebreakers: MssqlColumn[] = [];
  let keyed = keyNames.length > 0;
  for (const name of keyNames) {
    if (name === order_by) continue;
    const column = byName.get(name);
    if (isNil(column) || !isTiebreakType(column)) {
      keyed = false;
      break;
    }
    tiebreakers.push(column);
  }

  if (!keyed && !isGroupableOrderType(order)) {
    throw new Error(
      `${qualified} has no primary key or unique constraint, so rows sharing a "${order_by}" value have to be grouped by that value — which a ${order.type} column cannot be grouped by reliably. Add a key to the table, or order by a timestamp or a number.`
    );
  }

  return {
    mode: keyed ? 'keyset' : 'group',
    columns: keyed ? [order, ...tiebreakers] : [order],
    target: quoteTable(table),
    // order_direction describes how the user reads the table: DESC means the
    // newest rows carry the largest values. The drain runs the other way, from
    // the oldest row not yet delivered forward, so that a backlog is walked
    // through rather than jumped over -- taking the newest page first and
    // moving the position to its head silently discards everything between.
    drain: order_direction === 'DESC' ? 'ASC' : 'DESC',
    ahead: order_direction === 'DESC' ? '>' : '<',
  };
}

export function alias(index: number): string {
  return `${ALIAS}${index}`;
}

function positionProjection(columns: MssqlColumn[]): string {
  return columns
    .map((column, index) => `${cursorText(column)} AS ${quoteId(alias(index))}`)
    .join(', ');
}

function orderClause(plan: Plan, direction: OrderDirection): string {
  return plan.columns
    .map((column) => `${quoteId(column.name)} ${direction}`)
    .join(', ');
}

// Every comparison against NULL is UNKNOWN, so a NULL ordering value cannot
// serve as a position: once one became the cursor, nothing would ever match
// again. Those rows are excluded outright.
function notNullClause(plan: Plan): string {
  return `${quoteId(plan.columns[0].name)} IS NOT NULL`;
}

/** the direction the table reads in, which is the reverse of the drain */
function headDirection(plan: Plan): OrderDirection {
  return plan.drain === 'ASC' ? 'DESC' : 'ASC';
}

/**
 * Lexicographic keyset comparison, spelled out term by term because T-SQL has no
 * row-value comparison: `(a, b) > (@p0, @p1)` has to be written as
 * `a > @p0 OR (a = @p0 AND b > @p1)`.
 */
function keysetAhead(plan: Plan): string {
  const terms = plan.columns.map((column, index) => {
    const equal = plan.columns
      .slice(0, index)
      .map(
        (prior, position) =>
          `${quoteId(prior.name)} = ${cursorBind(prior, `@p${position}`)}`
      );
    const ahead = `${quoteId(column.name)} ${plan.ahead} ${cursorBind(
      column,
      `@p${index}`
    )}`;
    return `(${[...equal, ahead].join(' AND ')})`;
  });
  return `(${terms.join(' OR ')})`;
}

function projection(plan: Plan): string {
  return `*, ${positionProjection(plan.columns)}`;
}

/**
 * The next page of undelivered rows, in drain order: oldest first. A page can
 * stop anywhere, because the position names an exact row and picks up from it.
 */
export function keysetPageQuery(plan: Plan, position: string[] | null): string {
  const where = [notNullClause(plan)];
  if (position) {
    where.push(keysetAhead(plan));
  }
  return `SELECT TOP (@limit) ${projection(plan)} FROM ${
    plan.target
  } WHERE ${where.join(' AND ')} ORDER BY ${orderClause(plan, plan.drain)}`;
}

/**
 * The same page for a table with nothing unique to page on. Its position is an
 * ordering value rather than a row, so it can only resume between values, never
 * inside one: the caller asks for one row more than it wants and drops the
 * trailing value, which may have been cut in half.
 */
export function groupPageQuery(plan: Plan, position: string[] | null): string {
  const where = [notNullClause(plan)];
  if (position) {
    where.push(
      `${quoteId(plan.columns[0].name)} ${plan.ahead} ${cursorBind(
        plan.columns[0],
        '@p0'
      )}`
    );
  }
  return `SELECT TOP (@limit) ${projection(plan)} FROM ${
    plan.target
  } WHERE ${where.join(' AND ')} ORDER BY ${orderClause(plan, plan.drain)}`;
}

/**
 * Every row sharing one ordering value, for the case where a single value fills
 * a whole page and dropping it would leave nothing to deliver at all.
 */
export function groupValueQuery(plan: Plan): string {
  return `SELECT TOP (@limit) ${projection(plan)} FROM ${
    plan.target
  } WHERE ${quoteId(plan.columns[0].name)} = ${cursorBind(
    plan.columns[0],
    '@p0'
  )}`;
}

/** the position of the newest row already in the table, for a fresh baseline */
export function baselineQuery(plan: Plan): string {
  return `SELECT TOP (1) ${positionProjection(
    plan.columns
  )} FROM ${plan.target} WHERE ${notNullClause(plan)} ORDER BY ${orderClause(
    plan,
    headDirection(plan)
  )}`;
}

/** the most recent rows, for sample data; writes nothing and skips no position */
export function previewQuery(plan: Plan): string {
  return `SELECT TOP (@limit) * FROM ${plan.target} WHERE ${notNullClause(
    plan
  )} ORDER BY ${orderClause(plan, headDirection(plan))}`;
}

/**
 * Decides what a group-mode page can safely hand over. It is given one row more
 * than the caller asked for: if that extra row never arrived the range above the
 * position is exhausted and everything is deliverable, and otherwise the
 * trailing ordering value may have been cut in half and is left for the next
 * poll. `oversized` names the value that fills a whole page on its own, which
 * has to be fetched complete because trimming it would leave nothing at all.
 */
export function completeGroups<T extends Record<string, unknown>>(
  plan: Plan,
  rows: T[],
  limit: number
): { ready: T[]; oversized: string | null } {
  if (rows.length <= limit) {
    return { ready: rows, oversized: null };
  }
  const trailing = positionOf(plan, rows[rows.length - 1])[0];
  const ready = rows.filter((row) => positionOf(plan, row)[0] !== trailing);
  return ready.length > 0
    ? { ready, oversized: null }
    : { ready: [], oversized: trailing };
}

export function positionOf(
  plan: Plan,
  row: Record<string, unknown>
): string[] {
  return plan.columns.map((column, index) => {
    const value = row[alias(index)];
    if (isNil(value)) {
      // the ordering column is filtered NOT NULL and key columns are
      // non-nullable by construction, so this can only be a bug in here
      throw new Error(
        `Could not read a polling position from the column "${column.name}".`
      );
    }
    return String(value);
  });
}

export function stripPosition(
  plan: Plan,
  row: Record<string, unknown>
): Record<string, unknown> {
  const data = { ...row };
  plan.columns.forEach((_, index) => delete data[alias(index)]);
  return data;
}

export function newCursor(plan: Plan, position: string[] | null): Cursor {
  return {
    v: CURSOR_LAYOUT,
    m: plan.mode,
    c: plan.columns.map((column) => column.name),
    k: position,
  };
}

/**
 * The saved position, or null when it cannot be trusted against this plan: a
 * different layout, mode, or column list means re-baselining rather than binding
 * old values against columns they were never rendered from.
 */
export function reconcile(stored: Cursor | null, plan: Plan): Cursor | null {
  if (isNil(stored)) return null;
  const shape = plan.columns.map((column) => column.name);
  const matches =
    stored.v === CURSOR_LAYOUT &&
    stored.m === plan.mode &&
    Array.isArray(stored.c) &&
    stored.c.length === shape.length &&
    stored.c.every((name, index) => name === shape[index]) &&
    (stored.k === null ||
      (Array.isArray(stored.k) &&
        stored.k.length === shape.length &&
        stored.k.every((value) => typeof value === 'string')));
  return matches ? stored : null;
}
