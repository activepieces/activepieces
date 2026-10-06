/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, jest-dom/prefer-to-have-text-content, testing-library/no-node-access -- @testing-library/jest-dom is not a dependency of packages/web */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { DataTable } from '@/components/custom/data-table';

Reflect.set(
  globalThis,
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

type Row = { id: string; name: string };

const mount = (onRowClick?: (row: Row) => void) =>
  render(
    <MemoryRouter>
      <DataTable<Row, unknown, string>
        columns={[
          {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => (
              <span>
                {row.original.name}
                <button type="button">inner</button>
              </span>
            ),
          },
        ]}
        page={{
          data: [{ id: 'r1', name: 'First' }],
          next: null,
          previous: null,
        }}
        isLoading={false}
        isError={false}
        errorStateEntity="rows"
        emptyStateTextTitle="Nothing"
        emptyStateTextDescription="Nothing"
        emptyStateIcon={null}
        hidePagination
        onRowClick={onRowClick}
      />
    </MemoryRouter>,
  );

const firstRow = () => screen.getByText('First').closest('tr') as HTMLElement;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('DataTable keyboard rows', () => {
  it('makes a clickable row focusable and opens it with Enter and Space', () => {
    const onRowClick = vi.fn();
    mount(onRowClick);
    const row = firstRow();
    expect(row.tabIndex).toBe(0);
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });
    expect(onRowClick).toHaveBeenCalledTimes(2);
    expect(onRowClick.mock.calls[0][0]).toMatchObject({ id: 'r1' });
  });

  it('leaves keys pressed on controls inside the row to those controls', () => {
    const onRowClick = vi.fn();
    mount(onRowClick);
    fireEvent.keyDown(screen.getByText('inner'), { key: 'Enter' });
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('keeps rows out of the tab order when they open nothing', () => {
    mount();
    expect(firstRow().hasAttribute('tabindex')).toBe(false);
  });
});
