import { describe, expect, it } from 'vitest';
import {
  assertReadOnlyStatement,
  buildOrderBy,
  buildWhere,
  identifier,
  identifierValue,
  qualifiedName,
  sqlString,
} from '../src/lib/common/sql';
import { normalizePrivateKey } from '../src/lib/common/private-key';
import { buildCopyInto, stageReference } from '../src/lib/common/stage';
import { buildInsert } from '../src/lib/common/operations';
import { buildMerge } from '../src/lib/common/merge';

describe('identifiers', () => {
  it('keeps plain and quoted identifiers, quotes everything else', () => {
    expect(identifier({ name: 'orders' })).toBe('orders');
    expect(identifier({ name: '"My Table"' })).toBe('"My Table"');
    expect(identifier({ name: 'my table' })).toBe('"my table"');
    expect(identifier({ name: 'x"; DROP TABLE y; --' })).toBe('"x""; DROP TABLE y; --"');
    expect(() => identifier({ name: '  ' })).toThrow('empty');
  });
  it('splits qualified names outside quotes', () => {
    expect(qualifiedName({ value: 'DB.PUBLIC.ORDERS' })).toBe('DB.PUBLIC.ORDERS');
    expect(qualifiedName({ value: 'DB."a.b".T' })).toBe('DB."a.b".T');
    expect(qualifiedName({ value: 'db.my schema.t' })).toBe('db."my schema".t');
    expect(() => qualifiedName({ value: 'a.b.c.d' })).toThrow('not valid');
    expect(() => qualifiedName({ value: 'a..b' })).toThrow('not valid');
    expect(() => qualifiedName({ value: '"open' })).toThrow('unclosed');
  });
  it('resolves stored identifier values', () => {
    expect(identifierValue('orders')).toBe('ORDERS');
    expect(identifierValue('"orders"')).toBe('orders');
  });
  it('escapes string literals', () => {
    expect(sqlString("it's \\ ok")).toBe("'it''s \\\\ ok'");
  });
});

describe('read-only guard', () => {
  it('accepts read statements and strips one trailing semicolon', () => {
    expect(assertReadOnlyStatement('SELECT 1;')).toBe('SELECT 1');
    expect(assertReadOnlyStatement('-- c\nWITH a AS (SELECT 1) SELECT * FROM a')).toContain('WITH');
    expect(assertReadOnlyStatement("SELECT 'DELETE FROM x' AS s")).toContain('DELETE');
    expect(assertReadOnlyStatement('SHOW TABLES')).toBe('SHOW TABLES');
    expect(assertReadOnlyStatement('SELECT "update" FROM t')).toContain('"update"');
  });
  it('rejects writes, multiple statements and SYSTEM$ calls', () => {
    expect(() => assertReadOnlyStatement('DELETE FROM t')).toThrow('read-only');
    expect(() => assertReadOnlyStatement('SELECT 1; DROP TABLE t')).toThrow('Only one statement');
    expect(() => assertReadOnlyStatement('WITH a AS (SELECT 1) DELETE FROM t')).toThrow('DELETE');
    expect(() => assertReadOnlyStatement('/* x */ INSERT INTO t VALUES (1)')).toThrow('INSERT');
    expect(() => assertReadOnlyStatement("SELECT SYSTEM$CANCEL_QUERY('x')")).toThrow('SYSTEM$');
    expect(() => assertReadOnlyStatement('SELECT 1 /* open')).toThrow('unclosed');
    expect(() => assertReadOnlyStatement('  ')).toThrow('empty');
  });
});

describe('filters and sort', () => {
  it('turns filters into bound conditions', () => {
    const where = buildWhere([
      { column: 'status', operator: '=', value: 'open' },
      { column: 'id', operator: 'in', value: '1, 2' },
      { column: 'deleted_at', operator: 'IS NULL' },
    ]);
    expect(where.clause).toBe(' WHERE status = ? AND id IN (?, ?) AND deleted_at IS NULL');
    expect(where.binds).toEqual(['open', '1', '2']);
  });
  it('rejects unknown operators and missing values', () => {
    expect(() => buildWhere([{ column: 'a', operator: '; DROP' }])).toThrow('not supported');
    expect(() => buildWhere([{ column: 'a', operator: '=' }])).toThrow('needs a value');
    expect(buildWhere(undefined).clause).toBe('');
  });
  it('builds a validated ORDER BY', () => {
    expect(buildOrderBy([{ column: 'created_at', direction: 'desc' }])).toBe(' ORDER BY created_at DESC');
    expect(() => buildOrderBy([{ column: 'a', direction: 'sideways' }])).toThrow('ASC or DESC');
  });
});

describe('private key normalisation', () => {
  const body = 'A'.repeat(100);
  it('rebuilds PEM lines from a key pasted with spaces', () => {
    const pem = normalizePrivateKey(`-----BEGIN PRIVATE KEY----- ${body.slice(0, 50)} ${body.slice(50)} -----END PRIVATE KEY-----`);
    expect(pem.split('\n')).toEqual(['-----BEGIN PRIVATE KEY-----', 'A'.repeat(64), 'A'.repeat(36), '-----END PRIVATE KEY-----']);
  });
  it('keeps the ENCRYPTED header', () => {
    const pem = normalizePrivateKey(`-----BEGIN ENCRYPTED PRIVATE KEY-----\n${body}\n-----END ENCRYPTED PRIVATE KEY-----\n`);
    expect(pem.startsWith('-----BEGIN ENCRYPTED PRIVATE KEY-----\n')).toBe(true);
    expect(pem.endsWith('-----END ENCRYPTED PRIVATE KEY-----')).toBe(true);
  });
  it('accepts a bare body and rejects garbage', () => {
    expect(normalizePrivateKey(body)).toContain('-----BEGIN PRIVATE KEY-----');
    expect(() => normalizePrivateKey('not a key!')).toThrow('not valid PEM');
  });
});

describe('stages and COPY', () => {
  it('builds stage references safely', () => {
    expect(stageReference({ stage: '@db.public.my_stage', path: 'data/' })).toBe('@db.public.my_stage/data/');
    expect(stageReference({ stage: 'my_stage/data' })).toBe('@my_stage/data');
    expect(() => stageReference({ stage: 's', path: "x'; DROP" })).toThrow('not allowed');
    expect(() => stageReference({ stage: 's', path: '../x' })).toThrow('not allowed');
    expect(() => stageReference({ stage: '~' })).toThrow('not supported');
  });
  it('validates enums in COPY INTO', () => {
    expect(buildCopyInto({ table: 'T', stage: '@S', fileFormat: 'CSV', skipHeader: 1, onError: 'CONTINUE', pattern: ".*'x" })).toBe(
      "COPY INTO T FROM @S FILE_FORMAT = (TYPE = 'CSV' SKIP_HEADER = 1) PATTERN = '.*''x' ON_ERROR = 'CONTINUE'"
    );
    expect(() => buildCopyInto({ table: 'T', stage: '@S', fileFormat: "CSV' x" })).toThrow('File format');
    expect(() => buildCopyInto({ table: 'T', stage: '@S', fileFormat: 'CSV', onError: 'NOPE' })).toThrow('On Error');
  });
});

describe('insert and merge builders', () => {
  it('uses VALUES for scalars and PARSE_JSON for objects', () => {
    expect(buildInsert({ table: 'T', rows: [{ a: 1, b: 'x' }] })).toEqual({ sql: 'INSERT INTO T (a, b) VALUES (?, ?)', binds: [1, 'x'] });
    expect(buildInsert({ table: 'T', rows: [{ a: 1, tags: ['x'] }] })).toEqual({
      sql: 'INSERT INTO T (a, tags) SELECT ?, PARSE_JSON(?)',
      binds: [1, '["x"]'],
    });
    expect(() => buildInsert({ table: 'T', rows: [{ a: 1 }, { b: 2 }] })).toThrow('different set of columns');
  });
  it('quotes merge columns and binds through aliases', () => {
    const merge = buildMerge({ table: 'T', keyColumns: ['id'], values: { id: 1, 'first name': 'Jo' } });
    expect(merge.sql).toContain('ON target.id = source.C0');
    expect(merge.sql).toContain('target."first name" = source.C1');
    expect(merge.binds).toEqual([1, 'Jo']);
    expect(() => buildMerge({ table: 'T', keyColumns: ['id'], values: { id: 1 } })).toThrow('other than the key');
  });
});
