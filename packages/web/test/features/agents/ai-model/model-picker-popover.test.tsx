/**
 * @vitest-environment jsdom
 */
/* eslint-disable no-var, testing-library/no-unnecessary-act */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string, vars?: Record<string, string | number>) =>
    Object.entries(vars ?? {}).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      key,
    ),
}));

import {
  ModelPickerGroup,
  ModelPickerPopover,
} from '@/features/agents/ai-model/model-picker-popover';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

Element.prototype.scrollIntoView = () => undefined;
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as never;
if (!globalThis.PointerEvent) {
  globalThis.PointerEvent = MouseEvent as never;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const items = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`,
    value: `${prefix}-${index}`,
    name: `${prefix} model ${index}`,
    searchText: `${prefix} model ${index}`,
    disabled: index === 0,
  }));

const groups: ModelPickerGroup<string>[] = [
  { id: 'small', heading: 'Small key', items: items('alpha', 3) },
  { id: 'big', heading: 'Big key', items: items('beta', 35) },
];

const rows = () => document.querySelectorAll('[cmdk-item]');
const bodyText = () => document.body.textContent ?? '';

function typeSearch(text: string) {
  const input = document.querySelector<HTMLInputElement>('[cmdk-input]');
  if (input === null) {
    throw new Error('search input missing');
  }
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set;
  act(() => {
    setter?.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('ModelPickerPopover', () => {
  let root: Root | undefined;

  afterEach(() => {
    act(() => root?.unmount());
    document.body.innerHTML = '';
  });

  const mount = () => {
    act(() => {
      root = createRoot(document.body);
      root.render(
        <ModelPickerPopover
          groups={groups}
          emptyText="No models match"
          onPick={() => undefined}
          open
          onOpenChange={() => undefined}
        >
          <button type="button">Pick</button>
        </ModelPickerPopover>,
      );
    });
  };

  it('caps a long group and offers to show the rest', () => {
    mount();
    expect(rows()).toHaveLength(3 + 30 + 1);
    expect(bodyText()).toContain('Show all 35');
    expect(
      document.querySelector('[cmdk-item][aria-disabled="true"]'),
    ).not.toBeNull();
  });

  it('filters with its own matcher and drops empty groups', async () => {
    mount();
    typeSearch('alpha');
    await act(async () => {
      await Promise.resolve();
    });
    expect(rows()).toHaveLength(3);
    expect(bodyText()).not.toContain('Big key');
    typeSearch('nothing-here');
    await act(async () => {
      await Promise.resolve();
    });
    expect(rows()).toHaveLength(0);
    expect(bodyText()).toContain('No models match');
  });
});
