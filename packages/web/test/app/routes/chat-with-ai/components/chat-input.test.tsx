/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatInput } from '@/app/routes/chat-with-ai/components/chat-input';

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (match, name: string) => params?.[name] ?? match),
}));

const createObjectURL = vi.fn(() => 'blob:preview');
const revokeObjectURL = vi.fn();

beforeEach(() => {
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ChatInput', () => {
  it('shows an attached file as a chip with its type and size', () => {
    const { container } = renderInput();

    attach(container, [
      new File(['a'.repeat(12000)], 'new-leads.csv', { type: 'text/csv' }),
    ]);

    expect(screen.getByText('new-leads.csv')).toBeTruthy();
    expect(screen.getByText('CSV · 12 kB')).toBeTruthy();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('shows an image thumbnail and revokes it when the chip is removed', () => {
    const { container } = renderInput();

    attach(container, [
      new File(['png'], 'chart.png', { type: 'image/png' }),
    ]);

    expect(screen.getByText('Image · 3 B')).toBeTruthy();
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'blob:preview',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove chart.png' }));

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('revokes image previews on unmount', () => {
    const { container, unmount } = renderInput();
    attach(container, [new File(['png'], 'chart.png', { type: 'image/png' })]);

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('shows a labelled Stop button while working', () => {
    const onStop = vi.fn();
    renderInput({ isStreaming: true, onStop });

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    expect(onStop).toHaveBeenCalled();
  });

  it('keeps Send disabled until typing when asked to show it', () => {
    renderInput({ showSendWhenEmpty: true });

    const send = screen.getByRole('button', { name: 'Send message' });
    expect(send.hasAttribute('disabled')).toBe(true);

    fireEvent.change(screen.getByPlaceholderText('Reply...'), {
      target: { value: 'hi' },
    });

    expect(
      screen
        .getByRole('button', { name: 'Send message' })
        .hasAttribute('disabled'),
    ).toBe(false);
  });
});

function attach(container: HTMLElement, files: File[]) {
  const input = container.querySelector('input[type="file"]');
  if (input === null) throw new Error('file input missing');
  fireEvent.change(input, { target: { files } });
}

function renderInput({
  isStreaming = false,
  onStop,
  showSendWhenEmpty,
}: {
  isStreaming?: boolean;
  onStop?: () => void;
  showSendWhenEmpty?: boolean;
} = {}) {
  return render(
    <ChatInput
      isStreaming={isStreaming}
      onSend={vi.fn()}
      onStop={onStop}
      placeholder="Reply..."
      showSendWhenEmpty={showSendWhenEmpty}
    />,
  );
}
