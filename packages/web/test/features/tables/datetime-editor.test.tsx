/**
 * @vitest-environment jsdom
 *
 * Regression test for the DATETIME cell editor.
 *
 * The editor is popover-only (no text input), so the only ways to empty a cell
 * are react-day-picker's deselect gesture — clicking the already-selected day,
 * which emits `onSelect(undefined)` — and the Clear button. An early `return`
 * on a nil day used to swallow the gesture, leaving a set cell impossible to
 * clear at all.
 *
 * It also stages a pick in local state and commits once on close, so Escape has
 * to abandon that pick rather than commit it (matching DateEditor).
 *
 * The component is rendered for real. Only the leaf UI (Calendar, TimePicker,
 * Popover, Button) and the cell context are stubbed; the stubs hand the test
 * the component's real `onSelect` / `onOpenChange` / `onEscapeKeyDown`, exactly
 * as Radix and react-day-picker would call them. This file uses raw `react-dom`
 * + React's `act` rather than @testing-library/react (which is not a dependency
 * of this package).
 */
/* eslint-disable testing-library/no-unnecessary-act */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const calendarMock = vi.hoisted(() => ({
  onSelect: undefined as undefined | ((day: Date | undefined) => void),
}));

const popoverMock = vi.hoisted(() => ({
  onOpenChange: undefined as undefined | ((open: boolean) => void),
  onEscapeKeyDown: undefined as undefined | (() => void),
}));

const cellMock = vi.hoisted(() => ({
  value: '',
  handleCellChange: undefined as undefined | ((value: string) => void),
}));

vi.mock('@/features/tables/components/cell-context', () => ({
  useCellContext: () => ({
    value: cellMock.value,
    handleCellChange: cellMock.handleCellChange,
    setIsEditing: () => undefined,
    isEditing: true,
  }),
}));

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: { onSelect: (day: Date | undefined) => void }) => {
    calendarMock.onSelect = onSelect;
    return <div data-testid="calendar" />;
  },
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({
    onOpenChange,
    children,
  }: React.PropsWithChildren<{ onOpenChange: (open: boolean) => void }>) => {
    popoverMock.onOpenChange = onOpenChange;
    return <div>{children}</div>;
  },
  PopoverContent: ({
    onEscapeKeyDown,
    children,
  }: React.PropsWithChildren<{ onEscapeKeyDown: () => void }>) => {
    popoverMock.onEscapeKeyDown = onEscapeKeyDown;
    return <div>{children}</div>;
  },
  PopoverTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/components/custom/time-picker', () => ({
  TimePicker: () => <div data-testid="time-picker" />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    variant: _variant,
    size: _size,
    ...props
  }: React.ComponentProps<'button'> & {
    variant?: string;
    size?: string;
  }) => <button {...props}>{children}</button>,
}));

vi.mock('@/lib/format-utils', () => ({
  formatUtils: { formatDateTime: (date: Date) => date.toISOString() },
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

// eslint-disable-next-line import/first
import { DatetimeEditor } from '@/features/tables/components/datetime-editor';

declare global {
  // Tells React the test wraps updates in act(); see React's act() docs.
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const COMMITTED = '2026-08-12T14:30:00.000Z';

let container: HTMLDivElement;
let root: Root;
let committed: string[];

function setup(value: string) {
  committed = [];
  cellMock.value = value;
  cellMock.handleCellChange = (newValue: string) => committed.push(newValue);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<DatetimeEditor />);
  });
}

function clearButton(): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.includes('Clear'),
  );
  expect(button).toBeDefined();
  return button as HTMLButtonElement;
}

describe('DatetimeEditor', () => {
  beforeEach(() => {
    calendarMock.onSelect = undefined;
    popoverMock.onOpenChange = undefined;
    popoverMock.onEscapeKeyDown = undefined;
  });

  it('clears the cell when the selected day is clicked again', () => {
    setup(COMMITTED);

    act(() => {
      calendarMock.onSelect?.(undefined);
    });

    expect(committed).toEqual(['']);
  });

  it('clears the cell from the Clear button', () => {
    setup(COMMITTED);

    act(() => {
      clearButton().click();
    });

    expect(committed).toEqual(['']);
  });

  it('commits the staged pick when the popover closes', () => {
    setup(COMMITTED);

    act(() => {
      calendarMock.onSelect?.(new Date('2026-09-20T00:00:00.000Z'));
    });
    expect(committed).toEqual([]);

    act(() => {
      popoverMock.onOpenChange?.(false);
    });

    expect(committed).toHaveLength(1);
    expect(committed[0]).not.toBe(COMMITTED);
    expect(new Date(committed[0]).getTime()).not.toBeNaN();
  });

  it('abandons the staged pick when Escape closes the popover', () => {
    setup(COMMITTED);

    act(() => {
      calendarMock.onSelect?.(new Date('2026-09-20T00:00:00.000Z'));
    });

    act(() => {
      popoverMock.onEscapeKeyDown?.();
      popoverMock.onOpenChange?.(false);
    });

    expect(committed).toEqual([]);
  });

  it('does not write when the popover closes with no change', () => {
    setup(COMMITTED);

    act(() => {
      popoverMock.onOpenChange?.(false);
    });

    expect(committed).toEqual([]);
  });

  it('does not rewrite a stored value that is not normalized ISO', () => {
    setup('2026-08-12T14:30:00Z');

    act(() => {
      popoverMock.onOpenChange?.(false);
    });

    expect(committed).toEqual([]);
  });
});
