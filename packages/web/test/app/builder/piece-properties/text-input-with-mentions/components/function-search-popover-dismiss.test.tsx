/**
 * @vitest-environment jsdom
 *
 * The formula picker used to have Escape as its only dismissal path, so a click
 * anywhere else left it mounted on top of the properties below it (GIT-1702).
 * Clicking a function inside it must still insert rather than dismiss.
 *
 * This file uses raw `react-dom` + React's `act` rather than
 * @testing-library/react (which is not a dependency of this package), so the
 * testing-library lint rules that assume that library do not apply.
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { FunctionSearchPopover } from '@/app/builder/piece-properties/text-input-with-mentions/components/function-search-popover';

beforeAll(() => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: () => undefined,
    configurable: true,
  });
});

let root: Root | null = null;
let container: HTMLDivElement | null = null;
let editorEl: HTMLDivElement | null = null;

function renderPopover({ onClose }: { onClose: () => void }) {
  container = document.createElement('div');
  document.body.appendChild(container);
  editorEl = document.createElement('div');
  document.body.appendChild(editorEl);
  root = createRoot(container);
  act(() => {
    root?.render(
      <FunctionSearchPopover
        query="upper"
        position={{ top: 0, left: 0 }}
        editorRef={{ current: editorEl }}
        onSelect={() => undefined}
        onClose={onClose}
      />,
    );
  });
}

function mousedownOn(target: Element) {
  act(() => {
    target.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
    );
  });
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  editorEl?.remove();
  root = null;
  container = null;
  editorEl = null;
});

describe('FunctionSearchPopover dismissal (GIT-1702 regression)', () => {
  it('closes when the mousedown lands outside both the popover and the editor', () => {
    const onClose = vi.fn();
    renderPopover({ onClose });

    const outside = document.createElement('div');
    document.body.appendChild(outside);
    mousedownOn(outside);
    outside.remove();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays open when the mousedown lands on a function inside the popover', () => {
    const onClose = vi.fn();
    renderPopover({ onClose });

    const option = document.body.querySelector('[role="option"]');
    if (!option) {
      throw new Error('expected the popover to render at least one function');
    }
    mousedownOn(option);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('stays open when the mousedown lands inside the editor it belongs to', () => {
    const onClose = vi.fn();
    renderPopover({ onClose });

    if (!editorEl) {
      throw new Error('expected the stub editor element to exist');
    }
    mousedownOn(editorEl);

    expect(onClose).not.toHaveBeenCalled();
  });
});
