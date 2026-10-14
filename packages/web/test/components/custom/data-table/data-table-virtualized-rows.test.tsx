/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { DataTable } from '@/components/custom/data-table';

const virtualizerCounts = vi.hoisted((): number[] => []);

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => {
    virtualizerCounts.push(count);
    const items = Array.from({ length: count }, (_, index) => ({
      index,
      key: index,
      start: index * 53,
      end: (index + 1) * 53,
      size: 53,
    }));
    return {
      getVirtualItems: () => items,
      getTotalSize: () => count * 53,
      measureElement: () => undefined,
    };
  },
}));

function buildRows(count: number): Row[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `row-${index}`,
    name: `Row ${index}`,
  }));
}

function VirtualizedTable({ rows }: { rows: Row[] }) {
  return (
    <MemoryRouter>
      <DataTable<Row, unknown, string>
        columns={[{ accessorKey: 'name', header: 'Name' }]}
        page={{ data: rows, next: null, previous: null }}
        getRowId={(row) => row.id}
        isLoading={false}
        isError={false}
        errorStateEntity="rows"
        emptyStateTextTitle="Empty"
        emptyStateTextDescription=""
        emptyStateIcon={null}
        virtualizeRows
        hidePagination
      />
    </MemoryRouter>
  );
}

function renderedRowNames(): string[] {
  return screen
    .queryAllByText(/^Row \d+$/)
    .map((element) => element.textContent ?? '');
}

describe('DataTable virtualized rows', () => {
  it('shows every row after the data grows past the first render', () => {
    const { rerender } = render(<VirtualizedTable rows={buildRows(3)} />);
    expect(renderedRowNames()).toHaveLength(3);

    rerender(<VirtualizedTable rows={buildRows(50)} />);

    expect(virtualizerCounts.at(-1)).toBe(50);
    expect(renderedRowNames()).toHaveLength(50);
  });

  it('does not cap a large cold load at 1,000 rows', () => {
    const { rerender } = render(<VirtualizedTable rows={[]} />);

    rerender(<VirtualizedTable rows={buildRows(1500)} />);

    expect(virtualizerCounts.at(-1)).toBe(1500);
    expect(screen.getByText('Row 1499')).not.toBeNull();
  });
});

type Row = { id: string; name: string };
