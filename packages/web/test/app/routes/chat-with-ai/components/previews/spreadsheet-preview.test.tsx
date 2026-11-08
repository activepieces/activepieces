/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SpreadsheetPreview } from '@/app/routes/chat-with-ai/components/previews/spreadsheet-preview';

vi.mock('i18next', () => ({ t: (key: string) => key }));

afterEach(() => {
  cleanup();
});

describe('SpreadsheetPreview', () => {
  it('shows 5 rows inline, right-aligns numbers and links to the full table', () => {
    render(<SpreadsheetPreview table={table} label="Lead list" />);
    expect(screen.getAllByRole('row')).toHaveLength(6);
    const score = screen.getByText('92');
    expect(score.className).toContain('text-right');
    expect(screen.getByText('Dana Park').className).not.toContain(
      'text-right',
    );
    expect(
      screen.getByRole('button', {
        name: '{count, plural, =1 {Open full table · 1 row} other {Open full table · # rows}}',
      }),
    ).toBeTruthy();
  });

  it('filters rows in the expanded view by search', () => {
    openFullTable();
    const dialog = screen.getByRole('dialog');
    fireEvent.change(screen.getByPlaceholderText('Search rows'), {
      target: { value: 'contoso' },
    });
    expect(bodyColumn({ dialog, column: 0 })).toEqual(['Leo Brandt']);

    fireEvent.change(screen.getByPlaceholderText('Search rows'), {
      target: { value: 'nobody' },
    });
    expect(bodyColumn({ dialog, column: 0 })).toEqual([]);
    expect(dialog.textContent).toContain('No rows match your search.');
  });

  it('sorts the expanded rows by a column, numbers by value', () => {
    openFullTable();
    const dialog = screen.getByRole('dialog');
    const scoreHeader = () =>
      Array.from(dialog.querySelectorAll('th button')).find(
        (button) => button.textContent === 'Score',
      );

    fireEvent.click(scoreHeader() ?? dialog);
    expect(bodyColumn({ dialog, column: 1 })).toEqual([
      '7',
      '45',
      '77',
      '81',
      '92',
      '110',
    ]);

    fireEvent.click(scoreHeader() ?? dialog);
    expect(bodyColumn({ dialog, column: 1 })).toEqual([
      '110',
      '92',
      '81',
      '77',
      '45',
      '7',
    ]);
    expect(
      dialog.querySelector('th[aria-sort="descending"]')?.textContent,
    ).toBe('Score');
  });
});

function openFullTable() {
  render(<SpreadsheetPreview table={table} label="Lead list" />);
  fireEvent.click(
    screen.getByRole('button', {
      name: '{count, plural, =1 {Open full table · 1 row} other {Open full table · # rows}}',
    }),
  );
}

function bodyColumn({
  dialog,
  column,
}: {
  dialog: HTMLElement;
  column: number;
}): string[] {
  return Array.from(dialog.querySelectorAll('tbody tr')).map(
    (row) => row.querySelectorAll('td')[column]?.textContent ?? '',
  );
}

const table = {
  headers: ['Lead', 'Score', 'Company'],
  rows: [
    ['Dana Park', '92', 'Northwind'],
    ['Leo Brandt', '81', 'Contoso'],
    ['Mira Osei', '77', 'Fabrikam'],
    ['Ana Ruiz', '110', 'Tailspin'],
    ['Sam Lee', '7', 'Adventure Works'],
    ['Kai Moss', '45', 'Litware'],
  ],
};
