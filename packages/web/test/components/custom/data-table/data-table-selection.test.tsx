/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { sampleData } from '@/app/routes/platform/sample-data';
import { DataTable } from '@/components/custom/data-table';

vi.mock('i18next', () => ({
  t: (key: string) => key,
}));

type Row = { id: string; name: string };

function UnstablePageTable({ onChange }: { onChange: () => void }) {
  const [, setSelected] = React.useState<Row[]>([]);
  const page = {
    data: [{ id: 'a', name: 'Sample row' }],
    next: null,
    previous: null,
  };
  return (
    <DataTable<Row, unknown, 'name'>
      columns={[{ accessorKey: 'name', header: 'Name' }]}
      page={page}
      isLoading={false}
      isError={false}
      errorStateEntity="rows"
      emptyStateTextTitle="No rows"
      emptyStateTextDescription=""
      emptyStateIcon={null}
      selectColumn
      syncSelectionWithData
      onSelectedRowsChange={(rows) => {
        onChange();
        setSelected(rows);
      }}
    />
  );
}

describe('DataTable selection sync', () => {
  it('does not loop when the page is rebuilt on every render', () => {
    const onChange = vi.fn();
    render(
      <MemoryRouter>
        <UnstablePageTable onChange={onChange} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Sample row')).toBeTruthy();
    expect(onChange.mock.calls.length).toBeLessThan(5);
  });
});

describe('sampleData', () => {
  it('returns the same sample page every time', () => {
    expect(sampleData.apiKeysPage()).toBe(sampleData.apiKeysPage());
    expect(sampleData.secretManagers()).toBe(sampleData.secretManagers());
  });
});
