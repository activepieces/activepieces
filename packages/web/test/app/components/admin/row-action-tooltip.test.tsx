// @vitest-environment jsdom
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RowActionTooltip } from '@/app/components/admin';

function mountRowAction() {
  render(
    <RowActionTooltip label="Edit row">
      <button type="button" aria-label="Edit">
        edit
      </button>
    </RowActionTooltip>,
  );
  return screen.getByRole('button', { name: 'Edit' });
}

describe('RowActionTooltip', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('stays closed when focus returns to the trigger without focus-visible', () => {
    const button = mountRowAction();
    vi.spyOn(button, 'matches').mockReturnValue(false);

    act(() => {
      button.focus();
    });

    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('opens on keyboard focus-visible', () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const button = mountRowAction();
    vi.spyOn(button, 'matches').mockImplementation(
      (selector) => selector === ':focus-visible',
    );

    act(() => {
      button.focus();
    });

    expect(screen.getByRole('tooltip').textContent).toContain('Edit row');
  });
});
