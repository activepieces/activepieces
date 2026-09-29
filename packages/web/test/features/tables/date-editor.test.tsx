// @vitest-environment jsdom
/* eslint-disable testing-library/no-unnecessary-act */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const popoverMock = vi.hoisted(() => ({
  onOpenChange: undefined as undefined | ((open: boolean) => void),
  onEscapeKeyDown: undefined as undefined | ((e: KeyboardEvent) => void),
}));

const cellMock = vi.hoisted(() => ({
  value: '',
  isEditing: true,
  handleCellChange: undefined as undefined | ((value: string) => void),
  setIsEditing: undefined as undefined | ((isEditing: boolean) => void),
}));

vi.mock('@/features/tables/components/cell-context', () => ({
  useCellContext: () => ({
    value: cellMock.value,
    handleCellChange: cellMock.handleCellChange,
    setIsEditing: cellMock.setIsEditing,
    isEditing: cellMock.isEditing,
  }),
}));

const calendarMock = vi.hoisted(() => ({
  selected: undefined as undefined | Date,
  onSelect: undefined as undefined | ((day: Date | undefined) => void),
}));

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({
    selected,
    onSelect,
  }: {
    selected?: Date;
    onSelect: (day: Date | undefined) => void;
  }) => {
    calendarMock.selected = selected;
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
  }: React.PropsWithChildren<{
    onEscapeKeyDown?: (e: KeyboardEvent) => void;
  }>) => {
    popoverMock.onEscapeKeyDown = onEscapeKeyDown;
    return <div>{children}</div>;
  },
  PopoverTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const formatMock = vi.hoisted(() => ({ dayFirst: false }));

vi.mock('@/lib/format-utils', () => ({
  formatUtils: {
    formatDateOnly: (date: Date) =>
      formatMock.dayFirst
        ? `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
        : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
  },
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

// eslint-disable-next-line import/first
import { DateEditor } from '@/features/tables/components/date-editor';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const COMMITTED = new Date(2026, 0, 5).toISOString();

let container: HTMLDivElement;
let root: Root;
let committed: string[];
let closed: number;

function setup(value: string) {
  committed = [];
  closed = 0;
  cellMock.value = value;
  cellMock.isEditing = true;
  cellMock.handleCellChange = (newValue: string) => committed.push(newValue);
  cellMock.setIsEditing = (isEditing: boolean) => {
    if (!isEditing) {
      closed++;
    }
  };
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<DateEditor />);
  });
}

function typeIntoInput(text: string) {
  const input = container.querySelector('input');
  expect(input).not.toBeNull();
  const setValue = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set;
  act(() => {
    setValue?.call(input, text);
    input?.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function setEditing(isEditing: boolean) {
  cellMock.isEditing = isEditing;
  act(() => {
    root.render(<DateEditor />);
  });
}

function pressEscape() {
  const escape = new KeyboardEvent('keydown', {
    key: 'Escape',
    cancelable: true,
  });
  act(() => {
    popoverMock.onEscapeKeyDown?.(escape);
  });
  return escape;
}

function pressEnter() {
  act(() => {
    container
      .querySelector('input')
      ?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
  });
}

describe('DateEditor', () => {
  beforeEach(() => {
    popoverMock.onOpenChange = undefined;
    popoverMock.onEscapeKeyDown = undefined;
    formatMock.dayFirst = false;
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('commits the typed date when the popover is dismissed by clicking away', () => {
    setup(COMMITTED);
    typeIntoInput('09/17/2026');

    act(() => {
      popoverMock.onOpenChange?.(false);
    });

    expect(committed).toEqual([new Date('09/17/2026').toISOString()]);
  });

  it('commits a cleared cell when the typed text is removed before clicking away', () => {
    setup(COMMITTED);
    typeIntoInput('');

    act(() => {
      popoverMock.onOpenChange?.(false);
    });

    expect(committed).toEqual(['']);
  });

  it('abandons the typed date when Escape closes the popover', () => {
    setup(COMMITTED);
    typeIntoInput('09/17/2026');

    const escape = pressEscape();

    expect(escape.defaultPrevented).toBe(true);
    expect(committed).toEqual([]);
    expect(closed).toBe(1);
  });

  it('does not bring back an abandoned date on the next Enter', () => {
    setup(COMMITTED);
    typeIntoInput('09/17/2026');
    pressEscape();
    setEditing(false);
    setEditing(true);

    pressEnter();

    expect(committed).toEqual([]);
    expect(calendarMock.selected?.toISOString()).toBe(COMMITTED);
  });

  it('clears the cell when the selected day is deselected and the popover closes', () => {
    setup(COMMITTED);

    act(() => {
      calendarMock.onSelect?.(undefined);
    });
    act(() => {
      popoverMock.onOpenChange?.(false);
    });

    expect(committed).toEqual(['']);
  });

  it('commits a picked calendar day', () => {
    setup(COMMITTED);
    const day = new Date(2026, 8, 20);

    act(() => {
      calendarMock.onSelect?.(day);
    });

    expect(committed).toEqual([day.toISOString()]);
  });

  it('treats whitespace-only text as a clear', () => {
    setup(COMMITTED);
    typeIntoInput('   ');

    pressEnter();

    expect(committed).toEqual(['']);
  });

  it('commits the typed date on Enter', () => {
    setup(COMMITTED);
    typeIntoInput('09/17/2026');

    pressEnter();

    expect(committed).toEqual([new Date('09/17/2026').toISOString()]);
  });

  it('keeps the stored date when Enter is pressed on unparseable text', () => {
    setup(COMMITTED);
    typeIntoInput('not a date');

    pressEnter();

    expect(committed).toEqual([]);
    expect(closed).toBe(1);
  });

  it('keeps the stored date when unparseable text is left behind on click away', () => {
    setup(COMMITTED);
    typeIntoInput('not a date');

    act(() => {
      popoverMock.onOpenChange?.(false);
    });

    expect(committed).toEqual([]);
    expect(closed).toBe(1);
  });

  it('does not write when the popover is dismissed with no change', () => {
    setup(COMMITTED);

    act(() => {
      popoverMock.onOpenChange?.(false);
    });

    expect(committed).toEqual([]);
    expect(closed).toBe(1);
  });

  it('highlights the stored day in a day-first locale and does not write on close', () => {
    formatMock.dayFirst = true;
    setup(COMMITTED);

    expect(container.querySelector('input')?.value).toBe('5/1/2026');
    expect(calendarMock.selected?.toISOString()).toBe(COMMITTED);

    act(() => {
      popoverMock.onOpenChange?.(false);
    });

    expect(committed).toEqual([]);
    expect(closed).toBe(1);
  });
});
