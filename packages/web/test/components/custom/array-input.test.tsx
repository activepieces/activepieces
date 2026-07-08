/**
 * @vitest-environment jsdom
 *
 * Regression test for https://github.com/activepieces/activepieces/issues/13897
 *
 * Reordering an item in an ARRAY property and then adding/deleting another item
 * used to silently destroy values and leave blank rows behind, because the
 * component kept two sources of truth (local state + the index-based
 * react-hook-form Controllers) that drifted apart on reorder.
 *
 * The component is rendered for real with a real react-hook-form. Only the
 * dnd-kit `Sortable` wrapper and the leaf UI/icon components are stubbed; the
 * stubbed `Sortable` invokes the component's real `onMove`, exactly as a drag
 * would. This file uses raw `react-dom` + React's `act` rather than
 * @testing-library/react (which is not a dependency of this package), so the
 * testing-library lint rules that assume that library do not apply.
 */
/* eslint-disable testing-library/no-unnecessary-act */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

const sortableMock = vi.hoisted(() => ({
  onMove: undefined as
    | undefined
    | ((e: { activeIndex: number; overIndex: number }) => void),
}));

vi.mock('@/components/ui/sortable', () => ({
  Sortable: ({
    onMove,
    children,
  }: React.PropsWithChildren<{
    onMove?: (e: { activeIndex: number; overIndex: number }) => void;
  }>) => {
    sortableMock.onMove = onMove;
    return <div data-testid="sortable">{children}</div>;
  },
  SortableItem: ({ children }: React.PropsWithChildren) => <>{children}</>,
  SortableDragHandle: ({ children }: React.PropsWithChildren) => (
    <button type="button" data-drag-handle>
      {children}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  GripVertical: () => null,
  Plus: () => null,
  TrashIcon: () => null,
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/components/custom/text-with-icon', () => ({
  TextWithIcon: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({
    thin: _thin,
    ...props
  }: React.ComponentProps<'input'> & { thin?: boolean }) => (
    <input {...props} />
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    asChild: _asChild,
    variant: _variant,
    size: _size,
    ...props
  }: React.ComponentProps<'button'> & {
    asChild?: boolean;
    variant?: string;
    size?: string;
  }) => <button {...props}>{children}</button>,
}));

// eslint-disable-next-line import/first
import { ArrayInput } from '@/components/custom/array-input';

declare global {
  // Tells React the test wraps updates in act(); see React's act() docs.
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let formApi: UseFormReturn<{ items: string[] }> | undefined;

function Harness({
  defaultItems,
  required,
}: {
  defaultItems: string[];
  required?: boolean;
}) {
  const form = useForm<{ items: string[] }>({
    defaultValues: { items: defaultItems },
    mode: 'all',
  });
  formApi = form;
  return (
    <FormProvider {...form}>
      <ArrayInput inputName="items" disabled={false} required={required} />
    </FormProvider>
  );
}

function setup(defaultItems: string[], required?: boolean) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<Harness defaultItems={defaultItems} required={required} />);
  });
  expect(inputValues()).toEqual(defaultItems);
  expect(savedValue()).toEqual(defaultItems);
}

function inputValues(): string[] {
  return Array.from(container.querySelectorAll('input')).map((el) => el.value);
}

function savedValue(): unknown {
  return formApi?.getValues('items');
}

function reorder(activeIndex: number, overIndex: number) {
  act(() => {
    sortableMock.onMove?.({ activeIndex, overIndex });
  });
}

function clickRemove(index: number) {
  const removeButtons = Array.from(container.querySelectorAll('button')).filter(
    (b) => b.textContent?.includes('Remove'),
  );
  act(() => {
    removeButtons[index].click();
  });
}

function clickAdd() {
  const addButton = Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.includes('Add Item'),
  );
  act(() => {
    addButton?.click();
  });
}

function removeButtonCount(): number {
  return Array.from(container.querySelectorAll('button')).filter((b) =>
    b.textContent?.includes('Remove'),
  ).length;
}

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  sortableMock.onMove = undefined;
  formApi = undefined;
});

describe('ArrayInput (issue 13897)', () => {
  it('reordering alone never introduces holes in the saved form value', () => {
    setup(['A', 'B', 'C']);

    reorder(2, 0);

    expect(inputValues()).toEqual(['C', 'A', 'B']);
    expect(savedValue()).toEqual(['C', 'A', 'B']);
  });

  it('keeps every value after a reorder followed by a delete', () => {
    setup(['A', 'B', 'C']);

    reorder(2, 0);
    expect(inputValues()).toEqual(['C', 'A', 'B']);

    clickRemove(0);

    expect(inputValues()).toEqual(['A', 'B']);
    expect(savedValue()).toEqual(['A', 'B']);
  });

  it('keeps every value after a reorder followed by an add', () => {
    setup(['A', 'B', 'C']);

    reorder(2, 0);

    clickAdd();

    expect(inputValues()).toEqual(['C', 'A', 'B', '']);
    expect(savedValue()).toEqual(['C', 'A', 'B', '']);
  });

  it('hides the remove button for a required array once a single row is left', () => {
    setup(['A', 'B'], true);
    expect(removeButtonCount()).toBe(2);

    clickRemove(0);

    expect(inputValues()).toEqual(['B']);
    expect(savedValue()).toEqual(['B']);
    expect(removeButtonCount()).toBe(0);
  });
});
