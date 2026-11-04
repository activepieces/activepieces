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
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}

function renderTable({ data, url = '/' }: { data: Row[]; url?: string }) {
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
      />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe('AdminDataTable paging', () => {
  it('shows no footer while the list fits on one page', () => {
    renderTable({ data: rows(10) });

    expect(screen.getAllByText(/^Row \d+$/).length).toBe(10);
    expect(screen.queryAllByText('Rows per page').length).toBe(0);
  });

  it('pages a long list 10 rows at a time', async () => {
    renderTable({ data: rows(25) });

    expect(screen.getAllByText(/^Row \d+$/).length).toBe(10);
    expect(screen.queryAllByText('Row 10').length).toBe(0);
    expect(screen.getAllByText('Rows per page').length).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: /Next/ }));

    await waitFor(() => expect(screen.queryAllByText('Row 10').length).toBe(1));
    expect(screen.queryAllByText('Row 0').length).toBe(0);
  });

  it('sends an empty page back to the first page', async () => {
    renderTable({ data: [], url: '/?cursor=20' });

    await waitFor(() => {
      const search = screen.getByTestId('location').textContent ?? '';
      expect(search.includes('cursor')).toBe(false);
    });
  });
});
