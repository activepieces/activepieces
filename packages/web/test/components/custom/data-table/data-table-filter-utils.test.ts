import { describe, expect, it } from 'vitest';

import { dataTableFilterUtils } from '@/components/custom/data-table/data-table-filter-utils';

const ALLOWED = ['ACTIVE', 'INACTIVE', 'INVITED'];
const DEFAULTS = ['ACTIVE', 'INVITED'];

function selectedFor({
  query,
  defaultValues,
}: {
  query: string;
  defaultValues?: string[];
}) {
  return dataTableFilterUtils.getSelectedValues({
    searchParams: new URLSearchParams(query),
    key: 'status',
    allowedValues: ALLOWED,
    defaultValues,
  });
}

describe('dataTableFilterUtils.getSelectedValues', () => {
  it('returns the defaults when the param is absent', () => {
    expect(selectedFor({ query: '', defaultValues: DEFAULTS })).toEqual(
      DEFAULTS,
    );
  });

  it('returns the URL values when the param is present', () => {
    expect(
      selectedFor({ query: 'status=INACTIVE', defaultValues: DEFAULTS }),
    ).toEqual(['INACTIVE']);
  });

  it('returns nothing for an empty param, so a cleared filter stays cleared', () => {
    expect(selectedFor({ query: 'status=', defaultValues: DEFAULTS })).toEqual(
      [],
    );
  });

  it('drops values that are not options', () => {
    expect(
      selectedFor({
        query: 'status=PENDING&status=ACTIVE',
        defaultValues: DEFAULTS,
      }),
    ).toEqual(['ACTIVE']);
  });

  it('returns the raw URL values when the filter has no defaults', () => {
    expect(selectedFor({ query: 'status=&status=PENDING' })).toEqual([
      '',
      'PENDING',
    ]);
  });
});
