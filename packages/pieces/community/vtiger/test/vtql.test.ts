import { describe, expect, test } from 'vitest';
import {
  assertFieldName,
  assertModuleName,
  assertRecordId,
  buildWhere,
  clampLimit,
  escapeLikePattern,
  filterValueToString,
  pagedQuery,
  vtqlQuote,
} from '../src/lib/vtql';

describe('B7 VTQL safety', () => {
  test('quotes escape backslash then single quote', () => {
    expect(vtqlQuote("O'Brien")).toBe("'O\\'Brien'");
    expect(vtqlQuote('a\\b')).toBe("'a\\\\b'");
    expect(vtqlQuote("x\\' OR 1=1 --")).toBe("'x\\\\\\' OR 1=1 --'");
  });

  test.each(['Contacts; DELETE', 'Contacts WHERE 1=1', '', ' ', '1Contacts', "Leads'"])('module %j rejected', (name) => {
    expect(() => assertModuleName(name)).toThrow('Invalid module name');
  });

  test('module names are trimmed', () => {
    expect(assertModuleName(' HelpDesk ')).toBe('HelpDesk');
  });

  test.each(['email = 1', "lastname'", 'a-b', ''])('field %j rejected', (field) => {
    expect(() => assertFieldName(field)).toThrow('Invalid field name');
  });

  test.each(['12x345', ' 4x2063 '])('record id %j accepted', (id) => {
    expect(assertRecordId({ value: id })).toBe(id.trim());
  });

  test.each(['12345', 'x12', '12x', '12x3 OR 1', undefined])('record id %j rejected', (id) => {
    expect(() => assertRecordId({ value: id, label: 'Lead ID' })).toThrow('Lead ID');
  });

  test('buildWhere joins with AND and quotes every value', () => {
    expect(
      buildWhere({
        filters: [
          { field: 'lastname', value: "O'Neil", operator: '=' },
          { field: 'email', value: 'acme', operator: 'LIKE' },
        ],
      })
    ).toBe(" WHERE lastname = 'O\\'Neil' AND email LIKE '%acme%'");
    expect(buildWhere({ filters: [] })).toBe('');
  });

  test('buildWhere rejects injected field names', () => {
    expect(() => buildWhere({ filters: [{ field: '1=1 OR id', value: 'x', operator: '=' }] })).toThrow('Invalid field name');
  });

  test('filter values: booleans map to 1/0, numbers stay exact, objects rejected', () => {
    expect(filterValueToString(true)).toBe('1');
    expect(filterValueToString(false)).toBe('0');
    expect(filterValueToString(12.5)).toBe('12.5');
    expect(filterValueToString(null)).toBeUndefined();
    expect(() => filterValueToString({ a: 1 })).toThrow('text, numbers or booleans');
    expect(() => filterValueToString(Number.NaN)).toThrow('finite');
  });

  test('clampLimit validates and caps', () => {
    expect(clampLimit({ value: undefined, fallback: 100, max: 1000 })).toBe(100);
    expect(clampLimit({ value: '50', fallback: 100, max: 1000 })).toBe(50);
    expect(clampLimit({ value: 5000, fallback: 100, max: 1000 })).toBe(1000);
    expect(() => clampLimit({ value: 0, fallback: 100, max: 1000 })).toThrow('between 1 and 1000');
    expect(() => clampLimit({ value: 2.5, fallback: 100, max: 1000 })).toThrow();
  });
});

describe('D9 paging loops LIMIT off,100 until a short page', () => {
  test('reads 250 rows across three pages', async () => {
    const queries: string[] = [];
    const rows = Array.from({ length: 250 }, (_, i) => ({ id: `4x${i}` }));
    const { records, hasMore } = await pagedQuery({
      module: 'Contacts',
      where: " WHERE lastname = 'A'",
      limit: 1000,
      fetchPage: async (query) => {
        queries.push(query);
        const m = /LIMIT (\d+), (\d+);$/.exec(query);
        const offset = Number(m?.[1]);
        return rows.slice(offset, offset + Number(m?.[2]));
      },
    });
    expect(queries).toEqual([
      "SELECT * FROM Contacts WHERE lastname = 'A' LIMIT 0, 100;",
      "SELECT * FROM Contacts WHERE lastname = 'A' LIMIT 100, 100;",
      "SELECT * FROM Contacts WHERE lastname = 'A' LIMIT 200, 100;",
    ]);
    expect(records).toHaveLength(250);
    expect(hasMore).toBe(false);
  });

  test('stops at the limit and reports hasMore', async () => {
    const queries: string[] = [];
    const { records, hasMore } = await pagedQuery({
      module: 'Leads',
      where: '',
      limit: 150,
      fetchPage: async (query) => {
        queries.push(query);
        const size = Number(/, (\d+);$/.exec(query)?.[1]);
        return Array.from({ length: size }, (_, i) => ({ id: `10x${i}` }));
      },
    });
    expect(queries).toEqual(['SELECT * FROM Leads LIMIT 0, 100;', 'SELECT * FROM Leads LIMIT 100, 50;']);
    expect(records).toHaveLength(150);
    expect(hasMore).toBe(true);
  });

  test('a server that ignores LIMIT and returns more rows is trimmed per page', async () => {
    const { records } = await pagedQuery({
      module: 'Leads',
      where: '',
      limit: 3,
      fetchPage: async () => Array.from({ length: 100 }, (_, i) => ({ id: `10x${i}` })),
    });
    expect(records).toHaveLength(3);
  });

  test('orderBy is validated', async () => {
    await expect(
      pagedQuery({ module: 'Leads', where: '', orderBy: 'x; DROP', limit: 1, fetchPage: async () => [] })
    ).rejects.toThrow('Invalid field name');
  });
});

describe('LIKE patterns treat % and _ as literal characters', () => {
  test('escapeLikePattern escapes backslash, percent and underscore', () => {
    expect(escapeLikePattern('jo_ann%50\\x')).toBe('jo\\_ann\\%50\\\\x');
  });

  test('buildWhere sends escaped wildcards inside the quoted pattern', () => {
    expect(buildWhere({ filters: [{ field: 'email', value: 'jo_ann@example.com', operator: 'LIKE' }] })).toBe(
      " WHERE email LIKE '%jo\\\\_ann@example.com%'"
    );
    expect(buildWhere({ filters: [{ field: 'title', value: '100%', operator: 'LIKE' }] })).toBe(
      " WHERE title LIKE '%100\\\\%%'"
    );
  });

  test('exact matches are not escaped', () => {
    expect(buildWhere({ filters: [{ field: 'email', value: 'jo_ann@example.com', operator: '=' }] })).toBe(
      " WHERE email = 'jo_ann@example.com'"
    );
  });
});
