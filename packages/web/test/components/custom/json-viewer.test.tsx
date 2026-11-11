// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { JsonViewer } from '@/components/custom/json-viewer';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('sonner', () => ({ toast }));
vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/components/providers/theme-provider', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

function clickCopy(writeText: () => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  render(<JsonViewer json={42} title="Output" hideDownload />);
  fireEvent.click(screen.getByRole('button'));
}

describe('JsonViewer copy button', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reports a rejected clipboard write instead of claiming success', async () => {
    clickCopy(() =>
      Promise.reject(new DOMException('blocked', 'NotAllowedError')),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to copy to clipboard'),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('copies the json on a resolved clipboard write', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    clickCopy(writeText);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('42'));
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
