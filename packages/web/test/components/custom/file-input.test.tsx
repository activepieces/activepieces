// @vitest-environment jsdom
/* eslint-disable jest-dom/prefer-focus, jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
/* eslint-disable testing-library/no-container, testing-library/no-node-access -- the hidden file input has no role */
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FileInput } from '@/components/custom/file-input';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FileInput', () => {
  it('is a focusable button named by its label', () => {
    render(
      <>
        <label htmlFor="template">Flow file</label>
        <FileInput id="template" accept=".json" />
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Flow file' });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
  });

  it('opens the file picker when activated', () => {
    const pick = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(() => undefined);
    render(<FileInput aria-label="Upload" />);
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    expect(pick).toHaveBeenCalledTimes(1);
  });

  it('shows the chosen file name', () => {
    const { container } = render(<FileInput aria-label="Upload" />);
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    fireEvent.change(input!, {
      target: { files: [new File(['{}'], 'flow.json')] },
    });
    expect(
      screen.getByRole('button', { name: 'Upload' }).textContent,
    ).toContain('flow.json');
  });

  it('keeps the hidden input out of the tab order', () => {
    const { container } = render(<FileInput aria-label="Upload" />);
    const input = container.querySelector('input[type="file"]');
    expect(input?.getAttribute('tabindex')).toBe('-1');
  });
});
