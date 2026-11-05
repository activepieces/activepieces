// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DataDisplayTabs } from '@/app/builder/data-display/data-display-tabs';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('sonner', () => ({ toast }));
vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/components/custom/json-viewer', () => ({ JsonViewer: () => null }));

function mountCopyButton(writeText: () => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  render(
    <DataDisplayTabs data={{ a: 1 }} title="Output" copyableData={{ a: 1 }} />,
  );
  return screen.getByRole('button', { name: 'Copy to clipboard' });
}

describe('DataDisplayTabs copy button', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reports a rejected clipboard write instead of claiming success', async () => {
    const copyButton = mountCopyButton(() =>
      Promise.reject(new DOMException('blocked', 'NotAllowedError')),
    );

    fireEvent.click(copyButton);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to copy to clipboard',
        expect.anything(),
      ),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('confirms a resolved clipboard write', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    const copyButton = mountCopyButton(writeText);

    fireEvent.click(copyButton);

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Copied to clipboard',
        expect.anything(),
      ),
    );
    expect(writeText).toHaveBeenCalledWith(JSON.stringify({ a: 1 }, null, 2));
    expect(toast.error).not.toHaveBeenCalled();
  });
});
