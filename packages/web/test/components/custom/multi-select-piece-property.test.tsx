/**
 * @vitest-environment jsdom
 */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';

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

const optionsFor = (labels: string[]) =>
  labels.map((label) => ({ label, value: label }));

const triggerText = () =>
  document.querySelector<HTMLElement>('button')?.textContent;

const openAndPick = (label: string) => {
  const trigger = document.querySelector<HTMLElement>('button');
  act(() => {
    trigger?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  const item = Array.from(document.querySelectorAll('[cmdk-item]')).find(
    (candidate) => candidate.textContent === label,
  );
  act(() => {
    item?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    item?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

describe('MultiSelectPieceProperty selection basis', () => {
  let root: Root | undefined;
  let unhandled: unknown[] = [];

  beforeEach(() => {
    unhandled = [];
    process.on('uncaughtException', (error) => unhandled.push(error));
  });

  afterEach(() => {
    act(() => root?.unmount());
    process.removeAllListeners('uncaughtException');
    document.body.innerHTML = '';
  });

  const mount = (props: {
    options: string[];
    cachedOptions: string[];
    initialValues: unknown[];
    onChange: (value: unknown[] | null) => void;
  }) => {
    act(() => {
      root = createRoot(document.body);
      root.render(
        <MultiSelectPieceProperty
          placeholder="Select an option"
          options={optionsFor(props.options)}
          cachedOptions={optionsFor(props.cachedOptions)}
          initialValues={props.initialValues}
          onChange={props.onChange}
        />,
      );
    });
  };

  it('labels a selection the current option list no longer contains', () => {
    mount({
      options: ['W'],
      cachedOptions: ['X', 'Y', 'Z'],
      initialValues: ['Z'],
      onChange: () => undefined,
    });

    expect(triggerText()).toBe('Z');
  });

  it('adds to a selection that only the cached list can label', () => {
    const onChange = vi.fn();
    mount({
      options: ['W'],
      cachedOptions: ['X', 'Y', 'Z'],
      initialValues: ['Z'],
      onChange,
    });

    openAndPick('W');

    expect(onChange).toHaveBeenCalledWith(['Z', 'W']);
    expect(unhandled).toEqual([]);
  });

  it('keeps working when the cached list and the option list are identical', () => {
    const onChange = vi.fn();
    mount({
      options: ['X', 'Y', 'Z'],
      cachedOptions: ['X', 'Y', 'Z'],
      initialValues: ['Z'],
      onChange,
    });

    expect(triggerText()).toBe('Z');
    openAndPick('X');

    expect(onChange).toHaveBeenCalledWith(['Z', 'X']);
  });

  it('drops a selection absent from both lists', () => {
    mount({
      options: ['W'],
      cachedOptions: ['X'],
      initialValues: ['gone'],
      onChange: () => undefined,
    });

    expect(triggerText()).toBe('Select an option');
  });
});
