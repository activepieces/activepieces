// @vitest-environment jsdom
/* eslint-disable testing-library/no-node-access -- the row action is located through its rendered button */
import { act, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { DataTable } from '@/components/custom/data-table';

type Row = { id: string; name: string };

const ROWS: Row[] = [{ id: 'r1', name: 'Acme' }];

function RowAction() {
  const [clicks, setClicks] = useState(0);
  return (
    <button type="button" onClick={() => setClicks(clicks + 1)}>
      {`clicks ${clicks}`}
    </button>
  );
}

function Page({ tick, stable }: { tick: number; stable: boolean }) {
  return (
    <MemoryRouter>
      <span>{`tick ${tick}`}</span>
      <DataTable<Row, unknown, string>
        columns={[{ accessorKey: 'name', header: 'Name' }]}
        page={{ data: ROWS, next: null, previous: null }}
        isLoading={false}
        isError={false}
        errorStateEntity="rows"
        emptyStateTextTitle="Empty"
        emptyStateTextDescription=""
        emptyStateIcon={null}
        hidePagination
        stableRowActions={stable}
        actions={[() => <RowAction />]}
      />
    </MemoryRouter>
  );
}

describe('DataTable row actions', () => {
  it('keeps the same action element when the parent re-renders with stable row actions', () => {
    const { rerender } = render(<Page tick={0} stable />);
    const before = screen.getByRole('button', { name: 'clicks 0' });
    act(() => before.click());
    rerender(<Page tick={1} stable />);
    const after = screen.getByRole('button', { name: 'clicks 1' });
    expect(after).toBe(before);
  });

  it('remounts the action element by default, as before', () => {
    const { rerender } = render(<Page tick={0} stable={false} />);
    const before = screen.getByRole('button', { name: 'clicks 0' });
    act(() => before.click());
    rerender(<Page tick={1} stable={false} />);
    const after = screen.getByRole('button', { name: 'clicks 0' });
    expect(after).not.toBe(before);
  });
});
