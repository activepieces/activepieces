/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatOptionList } from '@/app/routes/chat-with-ai/components/chat-ui/chat-option';

vi.mock('i18next', () => ({ t: (key: string) => key }));

afterEach(() => {
  cleanup();
});

describe('ChatOptionList keyboard', () => {
  it('moves with wrapping arrows and picks with Enter and digits', () => {
    const onPick = vi.fn();
    render(
      <ChatOptionList
        items={[
          { id: 'gmail', label: 'Gmail' },
          { id: 'outlook', label: 'Outlook' },
          { id: 'yahoo', label: 'Yahoo' },
        ]}
        mode="radio"
        selected={[]}
        onPick={onPick}
        ariaLabel="Pick"
        numbered
        autoFocus
      />,
    );
    const option = (name: string) => screen.getByRole('option', { name });
    expect(document.activeElement).toBe(option('Gmail'));

    fireEvent.keyDown(option('Gmail'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(option('Yahoo'));
    fireEvent.keyDown(option('Yahoo'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(option('Gmail'));
    fireEvent.keyDown(option('Gmail'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(option('Outlook'));

    fireEvent.keyDown(option('Outlook'), { key: 'Enter' });
    fireEvent.keyDown(option('Outlook'), { key: '3' });
    fireEvent.keyDown(option('Outlook'), { key: '2', metaKey: true });

    expect(onPick.mock.calls).toEqual([['outlook'], ['yahoo']]);
  });
});
