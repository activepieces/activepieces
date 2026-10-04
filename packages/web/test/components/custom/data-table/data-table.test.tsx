/**
 * @vitest-environment jsdom
 */
import { SeekPage } from '@activepieces/core-utils';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  MemoryRouter,
  NavigateFunction,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { BulkAction, DataTable } from '@/components/custom/data-table';

Element.prototype.scrollIntoView = () => undefined;
Reflect.set(
  globalThis,
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);

describe('DataTable', () => {
  let root: Root | undefined;
  let container: HTMLDivElement;
  const address: { search: string } = { search: '' };
  const router: { navigate?: NavigateFunction } = {};
  const selections: string[][] = [];

  afterEach(() => {
    act(() => root?.unmount());
    root = undefined;
    document.body.innerHTML = '';
    selections.length = 0;
  });

  const mount = ({
    page,
    getRowId,
    bulkActions,
  }: {
    page: SeekPage<Row> | undefined;
    getRowId?: (row: Row) => string;
    bulkActions?: BulkAction<Row>[];
  }) => {
    const element = (
      <MemoryRouter initialEntries={['/rows']}>
        <AddressProbe address={address} router={router} />
        <DataTable
          columns={[
            {
              accessorKey: 'name',
              header: 'Name',
              cell: ({ row }) => row.original.name,
            },
          ]}
          page={page}
          isLoading={false}
          isError={false}
          errorStateEntity="rows"
          emptyStateTextTitle="Nothing"
          emptyStateTextDescription="Nothing"
          emptyStateIcon={null}
          selectColumn
          getRowId={getRowId}
          bulkActions={bulkActions}
          onSelectedRowsChange={(rows) =>
            selections.push(rows.map((row) => row.id))
          }
        />
      </MemoryRouter>
    );
    if (root) {
      act(() => root?.render(element));
      return;
    }
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root?.render(element));
  };

  const click = (element: Element | undefined) =>
    act(() => {
      element?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

  const button = (label: string) =>
    [...container.querySelectorAll('button')].find(
      (candidate) => candidate.textContent === label,
    );

  const cursor = () => new URLSearchParams(address.search).get('cursor');

  it('goes to the next page again after something else clears the cursor', () => {
    mount({ page: pageOf({ rows: ['a', 'b'], next: 'page-2' }) });

    click(button('Next'));
    expect(cursor()).toBe('page-2');

    act(() => router.navigate?.('/rows', { replace: true }));
    expect(cursor()).toBeNull();

    click(button('Next'));
    expect(cursor()).toBe('page-2');
  });

  it('keeps selected rows that are still shown and forgets the rest when the rows change', () => {
    const getRowId = (row: Row) => row.id;
    mount({ page: pageOf({ rows: ['a', 'b', 'c'] }), getRowId });

    const checkboxes = () => [
      ...container.querySelectorAll('tbody [role="checkbox"]'),
    ];
    click(checkboxes()[0]);
    click(checkboxes()[1]);
    expect(selections.at(-1)).toEqual(['a', 'b']);

    mount({ page: pageOf({ rows: ['a', 'c'] }), getRowId });
    expect(selections.at(-1)).toEqual(['a']);

    mount({ page: pageOf({ rows: ['a', 'b', 'c'] }), getRowId });
    expect(selections.at(-1)).toEqual(['a']);
  });

  it('keeps the selection but offers no bulk action while the next page is loading', () => {
    const getRowId = (row: Row) => row.id;
    const bulkActions: BulkAction<Row>[] = [
      { render: (rows) => <button>{`Delete ${rows.length}`}</button> },
    ];
    mount({ page: pageOf({ rows: ['a', 'b', 'c'] }), getRowId, bulkActions });

    const checkboxes = () => [
      ...container.querySelectorAll('tbody [role="checkbox"]'),
    ];
    click(checkboxes()[0]);
    click(checkboxes()[1]);
    expect(selections.at(-1)).toEqual(['a', 'b']);

    expect(button('Delete 2')).toBeDefined();

    mount({ page: undefined, getRowId, bulkActions });
    expect(button('Delete 2')).toBeUndefined();

    mount({ page: pageOf({ rows: ['a', 'b', 'c'] }), getRowId, bulkActions });
    expect(selections.at(-1)).toEqual(['a', 'b']);
    expect(button('Delete 2')).toBeDefined();
  });
});

function AddressProbe({
  address,
  router,
}: {
  address: { search: string };
  router: { navigate?: NavigateFunction };
}) {
  const location = useLocation();
  address.search = location.search;
  router.navigate = useNavigate();
  return null;
}

function pageOf({
  rows,
  next = null,
}: {
  rows: string[];
  next?: string | null;
}): SeekPage<Row> {
  return {
    data: rows.map((id) => ({ id, name: `Row ${id}` })),
    next,
    previous: null,
  };
}

type Row = { id: string; name: string };
