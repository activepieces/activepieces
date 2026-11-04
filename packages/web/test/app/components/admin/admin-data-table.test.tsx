/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AdminDataTable } from '@/app/components/admin/admin-data-table';

vi.mock('i18next', () => ({ t: (key: string) => key }));

type Row = { id: string; name: string };

const rows = (count: number): Row[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `row-${index}`,
    name: `Row ${index}`,
  }));

function LocationProbe() {
  return <div data-testid="location">{useLocation().search}</div>;
}

function renderTable({
  data,
  url = '/',
  onSelectedRowsChange,
}: {
  data: Row[];
  url?: string;
  onSelectedRowsChange?: (rows: Row[]) => void;
}) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <AdminDataTable<Row, unknown, string>
        columns={[{ accessorKey: 'name', header: 'Name' }]}
        page={{ data, next: null, previous: null }}
        isLoading={false}
        isError={false}
        errorStateEntity="rows"
        emptyStateTextTitle="No rows"
        emptyStateTextDescription=""
        emptyStateIcon={null}
        pageInBrowser
        hideFooterUntilNeeded
        selectColumn={!!onSelectedRowsChange}
        onSelectedRowsChange={onSelectedRowsChange}
        getRowId={(row) => row.id}
      />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe('AdminDataTable paging', () => {
  it('hides the footer for 10 rows and pages longer lists', async () => {
    renderTable({ data: rows(10) });
    expect(screen.queryAllByText('Rows per page').length).toBe(0);

    renderTable({ data: rows(25) });
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));

    await waitFor(() => expect(screen.queryAllByText('Row 10').length).toBe(1));
    expect(screen.queryAllByText('Row 24').length).toBe(0);
  });

  it('clears the selection when the page changes', async () => {
    const onSelectedRowsChange = vi.fn();
    renderTable({ data: rows(25), onSelectedRowsChange });

    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    await waitFor(() =>
      expect(onSelectedRowsChange).toHaveBeenLastCalledWith([
        expect.objectContaining({ id: 'row-0' }),
      ]),
    );
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));

    await waitFor(() =>
      expect(onSelectedRowsChange).toHaveBeenLastCalledWith([]),
    );
  });

  it('moves a link past the end to the last page', async () => {
    renderTable({ data: rows(25), url: '/?cursor=500' });

    await waitFor(() => {
      const search = screen.getByTestId('location').textContent ?? '';
      expect(search.includes('cursor=20')).toBe(true);
    });
    expect(screen.queryAllByText('Row 24').length).toBe(1);
  });
});
