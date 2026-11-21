import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordParamsUtils } from '../src/lib/common/record-params';

const { parseQueryConditions, parseRecordValues, parseLimit } = recordParamsUtils;

describe('parseQueryConditions', () => {
  describe('plain fields and subfields', () => {
    it('builds an eq condition on the field itself from a value input', () => {
      const result = parseQueryConditions({
        input: { name_operator: 'eq', name_value: 'Acme' },
      });

      expect(result).toEqual([{ field: 'name', operator: 'eq', value: 'Acme' }]);
    });

    it('builds a dotted path for a subfield input', () => {
      const result = parseQueryConditions({
        input: { name_operator: 'eq', name_firstName: 'Ada' },
      });

      expect(result).toEqual([
        { field: 'name.firstName', operator: 'eq', value: 'Ada' },
      ]);
    });

    it('splits on the last delimiter so field names may contain underscores', () => {
      const result = parseQueryConditions({
        input: { job_title_operator: 'eq', job_title_value: 'CTO' },
      });

      expect(result).toEqual([
        { field: 'job_title', operator: 'eq', value: 'CTO' },
      ]);
    });

    it('keeps one condition per field in input order', () => {
      const result = parseQueryConditions({
        input: {
          name_operator: 'eq',
          name_value: 'Acme',
          city_operator: 'neq',
          city_value: 'Paris',
        },
      });

      expect(result).toEqual([
        { field: 'name', operator: 'eq', value: 'Acme' },
        { field: 'city', operator: 'neq', value: 'Paris' },
      ]);
    });

    it('ignores the header input', () => {
      const result = parseQueryConditions({
        input: { name_header: 'Name', name_operator: 'eq', name_value: 'Acme' },
      });

      expect(result).toEqual([{ field: 'name', operator: 'eq', value: 'Acme' }]);
    });

    it('keeps number and boolean values as they are', () => {
      const result = parseQueryConditions({
        input: {
          employees_operator: 'gt',
          employees_value: 10,
          active_operator: 'eq',
          active_value: true,
        },
      });

      expect(result).toEqual([
        { field: 'employees', operator: 'gt', value: 10 },
        { field: 'active', operator: 'eq', value: true },
      ]);
    });
  });

  describe('inputs that produce no condition', () => {
    it('skips a field without an operator', () => {
      expect(parseQueryConditions({ input: { name_value: 'Acme' } })).toEqual([]);
    });

    it('skips a field with an unknown operator', () => {
      const result = parseQueryConditions({
        input: { name_operator: 'between', name_value: 'Acme' },
      });

      expect(result).toEqual([]);
    });

    it('skips values that are not strings, numbers, booleans or string lists', () => {
      const result = parseQueryConditions({
        input: {
          address_operator: 'eq',
          address_value: { street: 'Main' },
          scores_operator: 'in',
          scores_value: [1, 2],
        },
      });

      expect(result).toEqual([]);
    });

    it('ignores keys without a delimiter or with nothing before it', () => {
      const result = parseQueryConditions({
        input: { name: 'Acme', _value: 'Acme', _operator: 'eq' },
      });

      expect(result).toEqual([]);
    });

    it('skips a field whose value was left blank', () => {
      const result = parseQueryConditions({
        input: { email_operator: 'eq', email_value: '' },
      });

      expect(result).toEqual([]);
    });

    it('skips a list field whose value holds only separators', () => {
      const result = parseQueryConditions({
        input: { tags_operator: 'containsAny', tags_value: ' , ,' },
      });

      expect(result).toEqual([]);
    });
  });

  describe('list operators', () => {
    it.each(['in', 'containsAny'])(
      'splits a comma separated value for %s and drops empty items',
      (operator) => {
        const result = parseQueryConditions({
          input: { tags_operator: operator, tags_value: 'a, b,,c' },
        });

        expect(result).toEqual([
          { field: 'tags', operator, value: ['a', 'b', 'c'] },
        ]);
      }
    );

    it('does not split a comma separated value for eq', () => {
      const result = parseQueryConditions({
        input: { name_operator: 'eq', name_value: 'Acme, Inc' },
      });

      expect(result).toEqual([
        { field: 'name', operator: 'eq', value: 'Acme, Inc' },
      ]);
    });

    it('passes an array value through unchanged', () => {
      const result = parseQueryConditions({
        input: { tags_operator: 'in', tags_value: ['a', 'b'] },
      });

      expect(result).toEqual([{ field: 'tags', operator: 'in', value: ['a', 'b'] }]);
    });
  });

  describe('primary values that also search the additional values', () => {
    it.each([
      ['emails', 'primaryEmail', 'additionalEmails'],
      ['links', 'primaryLinkUrl', 'secondaryLinks'],
      ['phones', 'primaryPhoneNumber', 'additionalPhones'],
    ])(
      'matches %s.%s or any of %s for eq',
      (field, primary, additional) => {
        const result = parseQueryConditions({
          input: { [`${field}_operator`]: 'eq', [`${field}_${primary}`]: 'x' },
        });

        expect(result).toEqual([
          {
            conjunction: 'or',
            conditions: [
              { field: `${field}.${primary}`, operator: 'eq', value: 'x' },
              { field: `${field}.${additional}`, operator: 'like', value: '%"x"%' },
            ],
          },
        ]);
      }
    );

    it('requires neither the primary nor any additional value to match for neq', () => {
      const result = parseQueryConditions({
        input: { emails_operator: 'neq', emails_primaryEmail: 'ada@acme.com' },
      });

      expect(result).toEqual([
        {
          conjunction: 'and',
          conditions: [
            { field: 'emails.primaryEmail', operator: 'neq', value: 'ada@acme.com' },
            {
              conjunction: 'or',
              conditions: [
                {
                  conjunction: 'not',
                  conditions: [
                    {
                      field: 'emails.additionalEmails',
                      operator: 'like',
                      value: '%"ada@acme.com"%',
                    },
                  ],
                },
                { field: 'emails.additionalEmails', operator: 'is', value: 'NULL' },
              ],
            },
          ],
        },
      ]);
    });

    it('adds one additional value check per item for in', () => {
      const result = parseQueryConditions({
        input: { emails_operator: 'in', emails_primaryEmail: 'a@x.com, b@x.com' },
      });

      expect(result).toEqual([
        {
          conjunction: 'or',
          conditions: [
            { field: 'emails.primaryEmail', operator: 'in', value: ['a@x.com', 'b@x.com'] },
            { field: 'emails.additionalEmails', operator: 'like', value: '%"a@x.com"%' },
            { field: 'emails.additionalEmails', operator: 'like', value: '%"b@x.com"%' },
          ],
        },
      ]);
    });

    it('matches only the start of an additional value for startsWith', () => {
      const result = parseQueryConditions({
        input: { emails_operator: 'startsWith', emails_primaryEmail: 'ada' },
      });

      expect(result).toEqual([
        {
          conjunction: 'or',
          conditions: [
            { field: 'emails.primaryEmail', operator: 'startsWith', value: 'ada' },
            { field: 'emails.additionalEmails', operator: 'like', value: '%"ada%' },
          ],
        },
      ]);
    });

    it('keeps ilike case-insensitive on the additional values', () => {
      const result = parseQueryConditions({
        input: { emails_operator: 'ilike', emails_primaryEmail: 'ADA@acme.com' },
      });

      expect(result).toEqual([
        {
          conjunction: 'or',
          conditions: [
            { field: 'emails.primaryEmail', operator: 'ilike', value: 'ADA@acme.com' },
            { field: 'emails.additionalEmails', operator: 'ilike', value: '%"ADA@acme.com"%' },
          ],
        },
      ]);
    });

    it('uses a like pattern the user wrote with % as is', () => {
      const result = parseQueryConditions({
        input: { emails_operator: 'like', emails_primaryEmail: '%@acme.com' },
      });

      expect(result).toEqual([
        {
          conjunction: 'or',
          conditions: [
            { field: 'emails.primaryEmail', operator: 'like', value: '%@acme.com' },
            { field: 'emails.additionalEmails', operator: 'like', value: '%@acme.com' },
          ],
        },
      ]);
    });

    it('escapes LIKE wildcards and backslashes in the additional value pattern', () => {
      const result = parseQueryConditions({
        input: { emails_operator: 'eq', emails_primaryEmail: '100%_off\\' },
      });

      expect(result).toEqual([
        {
          conjunction: 'or',
          conditions: [
            { field: 'emails.primaryEmail', operator: 'eq', value: '100%_off\\' },
            {
              field: 'emails.additionalEmails',
              operator: 'like',
              value: '%"100\\%\\_off\\\\"%',
            },
          ],
        },
      ]);
    });

    it('does not expand operators that have no additional value pattern', () => {
      const result = parseQueryConditions({
        input: { emails_operator: 'is', emails_primaryEmail: 'NULL' },
      });

      expect(result).toEqual([
        { field: 'emails.primaryEmail', operator: 'is', value: 'NULL' },
      ]);
    });
  });

  describe('date ranges', () => {
    const now = new Date('2026-01-15T12:00:00.000Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('covers the past days for a negative preset', () => {
      const result = parseQueryConditions({ input: { createdAt_preset: -7 } });

      expect(result).toEqual([
        { field: 'createdAt', operator: 'gte', value: '2026-01-08T12:00:00.000Z' },
        { field: 'createdAt', operator: 'lte', value: '2026-01-15T12:00:00.000Z' },
      ]);
    });

    it('covers the coming days for a positive preset', () => {
      const result = parseQueryConditions({ input: { closeDate_preset: 7 } });

      expect(result).toEqual([
        { field: 'closeDate', operator: 'gte', value: '2026-01-15T12:00:00.000Z' },
        { field: 'closeDate', operator: 'lte', value: '2026-01-22T12:00:00.000Z' },
      ]);
    });

    it('uses the after and before inputs for a custom range', () => {
      const result = parseQueryConditions({
        input: {
          createdAt_preset: 'custom',
          createdAt_after: '2026-01-01',
          createdAt_before: '2026-01-31',
        },
      });

      expect(result).toEqual([
        { field: 'createdAt', operator: 'gte', value: '2026-01-01' },
        { field: 'createdAt', operator: 'lte', value: '2026-01-31' },
      ]);
    });

    it('leaves the missing end of a custom range without a value', () => {
      const result = parseQueryConditions({
        input: { createdAt_preset: 'custom', createdAt_after: '2026-01-01' },
      });

      expect(result).toEqual([
        { field: 'createdAt', operator: 'gte', value: '2026-01-01' },
        { field: 'createdAt', operator: 'lte', value: undefined },
      ]);
    });

    it('produces nothing for an unknown preset', () => {
      const result = parseQueryConditions({ input: { createdAt_preset: 'someday' } });

      expect(result).toEqual([]);
    });

    it('ignores operator and value inputs when a preset is set', () => {
      const result = parseQueryConditions({
        input: {
          createdAt_preset: 'custom',
          createdAt_operator: 'eq',
          createdAt_value: '2020-01-01',
          createdAt_after: '2026-01-01',
          createdAt_before: '2026-01-31',
        },
      });

      expect(result).toEqual([
        { field: 'createdAt', operator: 'gte', value: '2026-01-01' },
        { field: 'createdAt', operator: 'lte', value: '2026-01-31' },
      ]);
    });
  });
});

describe('parseRecordValues', () => {
  it('sets a field from its value input and ignores operator and header', () => {
    const result = parseRecordValues({
      input: { name_value: 'Acme', name_operator: 'eq', name_header: 'Name' },
    });

    expect(result).toEqual({ name: 'Acme' });
  });

  it('builds an object of only the filled subfields when the value is empty', () => {
    const result = parseRecordValues({
      input: { name_value: '', name_firstName: 'Ada', name_lastName: '' },
    });

    expect(result).toEqual({ name: { firstName: 'Ada' } });
  });

  it('leaves out fields where everything is empty', () => {
    const result = parseRecordValues({
      input: {
        a_value: '',
        b_value: null,
        c_value: undefined,
        d_value: [],
        e_firstName: '',
      },
    });

    expect(result).toEqual({});
  });

  it('keeps zero and false as real values', () => {
    const result = parseRecordValues({
      input: { employees_value: 0, active_value: false },
    });

    expect(result).toEqual({ employees: 0, active: false });
  });

  it('prefers the value input over subfields of the same field', () => {
    const result = parseRecordValues({
      input: { name_value: 'Acme', name_firstName: 'Ada' },
    });

    expect(result).toEqual({ name: 'Acme' });
  });
});

describe('parseLimit', () => {
  it.each<[string, unknown, number]>([
    ['keeps a positive value', 25, 25],
    ['keeps a value above the page size', 500, 500],
    ['raises a value below the minimum to 1', 0, 1],
    ['drops the fraction of a decimal', 10.7, 10],
    ['uses the default when the limit is empty', undefined, 60],
    ['uses the default for a value that is not a number', '25', 60],
    ['uses the default for NaN', Number.NaN, 60],
  ])('%s', (_, input, expected) => {
    expect(parseLimit({ enabled: true, input })).toBe(expected);
  });

  it('applies the limit when the toggle was never set', () => {
    expect(parseLimit({ enabled: undefined, input: 25 })).toBe(25);
  });

  it('returns no limit when the toggle is off', () => {
    expect(parseLimit({ enabled: false, input: 25 })).toBeUndefined();
  });
});
