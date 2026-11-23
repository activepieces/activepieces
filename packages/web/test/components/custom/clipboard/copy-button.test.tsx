// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CopyButton } from '@/components/custom/clipboard/copy-button';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('i18next', () => ({ t: (key: string) => key }));

describe('CopyButton', () => {
  it('still copies when a parent passes its own onClick', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const parentClick = vi.fn();
    render(<CopyButton value="hello" onClick={parentClick} withoutTooltip />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(parentClick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('hello'));
  });
});
