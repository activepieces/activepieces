import {
  SharedTemplate,
  TemplateStatus,
  TemplateType,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    key.replace(/\{(\w+)\}/g, (_, name) => String(params?.[name])),
}));

vi.mock('@/lib/dom-utils', () => ({ downloadFile: vi.fn() }));

import { tablesUtils } from '@/features/tables/utils/utils';

const asTemplate = (tables: unknown[]): SharedTemplate =>
  JSON.parse(
    JSON.stringify({
      name: 'anything',
      type: TemplateType.SHARED,
      summary: '',
      description: '',
      tags: [],
      blogUrl: null,
      metadata: null,
      author: '',
      categories: [],
      pieces: [],
      tables,
      status: TemplateStatus.PUBLISHED,
    }),
  );

const customers = {
  name: 'Customers',
  externalId: 'customers',
  fields: [{ name: 'Email', type: 'TEXT', externalId: 'email' }],
  data: { type: 'CSV', rows: [[{ fieldId: 'email', value: 'a@b.com' }]] },
};

const invalidPrefix = 'This file is not a valid table template: ';

describe('tablesUtils.getTemplateError', () => {
  it.each([
    ['an exported table template', customers],
    [
      'a git-sync table state with no data',
      {
        name: 'Leads',
        externalId: 'leads',
        fields: [{ name: 'Name', type: 'TEXT', externalId: 'name' }],
        status: null,
        trigger: null,
      },
    ],
  ])('accepts %s', (_, table) => {
    expect(
      tablesUtils.getTemplateError({ template: asTemplate([table]) }),
    ).toBeNull();
  });

  it.each([
    [
      'a file that is not a table',
      { name: 'Send a Slack message', trigger: { type: 'PIECE_TRIGGER' } },
      'it has no list of columns',
    ],
    [
      'a table that is not an object',
      'Customers',
      'one of its tables is not in the expected format',
    ],
    [
      'a table with no name',
      { ...customers, name: undefined },
      'the table has no name',
    ],
    [
      'a status that is not text',
      { ...customers, status: true },
      'the table status is not in the expected format',
    ],
    [
      'a trigger that is not text',
      { ...customers, trigger: { type: 'ON_NEW_RECORD' } },
      'the table trigger is not in the expected format',
    ],
    [
      'an unsupported column type',
      { ...customers, fields: [
          { name: 'Email', type: 'NOT_A_REAL_TYPE', externalId: 'email' },
        ], },
      'column "Email" has an unsupported type "NOT_A_REAL_TYPE"',
    ],
    [
      'a dropdown with no options',
      {
        ...customers,
        fields: [
          {
            name: 'Plan',
            type: 'STATIC_DROPDOWN',
            data: null,
            externalId: 'plan',
          },
        ],
      },
      'column "Plan" is a dropdown with no options',
    ],
    [
      'a column with no name',
      { ...customers, fields: [{ type: 'TEXT' }] },
      'column 1 has no name',
    ],
    [
      'a table with no externalId',
      { ...customers, externalId: undefined },
      'the table has no externalId',
    ],
    [
      'a column with no externalId',
      { ...customers, fields: [{ name: 'Email', type: 'TEXT' }] },
      'column "Email" has no externalId',
    ],
    [
      'a cell whose value is not text',
      {
        ...customers,
        data: { type: 'CSV', rows: [[{ fieldId: 'email', value: 42 }]] },
      },
      'its rows are not in the expected format',
    ],
    [
      'rows that are not arrays of cells',
      { ...customers, data: { rows: [{ fieldId: 'email', value: 'x' }] } },
      'its rows are not in the expected format',
    ],
  ])('explains %s', (_, table, reason) => {
    expect(
      tablesUtils.getTemplateError({ template: asTemplate([table]) }),
    ).toBe(invalidPrefix + reason);
  });

  it('explains a template with no tables', () => {
    expect(tablesUtils.getTemplateError({ template: asTemplate([]) })).toBe(
      invalidPrefix + 'it has no tables',
    );
  });

  it('rejects more than one table only when importing into an existing table', () => {
    const template = asTemplate([customers, customers]);

    expect(
      tablesUtils.getTemplateError({ template, existingTableId: 'table-1' }),
    ).toBe(
      invalidPrefix +
        'it has more than one table, but you can only import one into an existing table',
    );
    expect(tablesUtils.getTemplateError({ template })).toBeNull();
  });
});
