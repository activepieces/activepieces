/**
 * @vitest-environment jsdom
 */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatInput } from '@/app/routes/chat-with-ai/components/chat-input';
import { composerStore } from '@/app/routes/chat-with-ai/lib/composer-store';

vi.mock('i18next', () => ({ t: (key: string) => key }));

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('ChatInput queue', () => {
  it('sends the queued message when the reply ends', () => {
    const onSend = vi.fn();
    const { rerender } = render(
      <ChatInput isStreaming onSend={onSend} onStop={vi.fn()} />,
    );

    type('Then add a summary');
    pressEnter();

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByText('Then add a summary')).toBeDefined();
    expect(textarea().value).toBe('');

    rerender(
      <ChatInput isStreaming={false} onSend={onSend} onStop={vi.fn()} />,
    );

    expect(onSend).toHaveBeenCalledWith('Then add a summary', undefined);
    expect(screen.queryByText('Then add a summary')).toBeNull();
  });

  it('puts the queued message back in the composer on cancel', () => {
    const onSend = vi.fn();
    const { rerender } = render(
      <ChatInput isStreaming onSend={onSend} onStop={vi.fn()} />,
    );

    type('Then add a summary');
    pressEnter();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    rerender(
      <ChatInput isStreaming={false} onSend={onSend} onStop={vi.fn()} />,
    );

    expect(onSend).not.toHaveBeenCalled();
    expect(textarea().value).toBe('Then add a summary');
  });

  it('keeps the queued message when the reply is stopped', () => {
    const onSend = vi.fn();
    const { rerender } = render(
      <ChatInput isStreaming onSend={onSend} onStop={vi.fn()} />,
    );

    type('Then add a summary');
    pressEnter();
    rerender(
      <ChatInput
        isStreaming={false}
        replyStopped
        onSend={onSend}
        onStop={vi.fn()}
      />,
    );

    expect(onSend).not.toHaveBeenCalled();
    expect(textarea().value).toBe('Then add a summary');
  });
});

describe('ChatInput drafts', () => {
  it('keeps the text of each chat', () => {
    const { rerender } = render(
      <ChatInput isStreaming={false} onSend={vi.fn()} draftKey="chat-a" />,
    );

    type('Draft for A');
    rerender(
      <ChatInput isStreaming={false} onSend={vi.fn()} draftKey="chat-b" />,
    );
    expect(textarea().value).toBe('');

    type('Draft for B');
    rerender(
      <ChatInput isStreaming={false} onSend={vi.fn()} draftKey="chat-a" />,
    );
    expect(textarea().value).toBe('Draft for A');

    rerender(
      <ChatInput isStreaming={false} onSend={vi.fn()} draftKey="chat-b" />,
    );
    expect(textarea().value).toBe('Draft for B');
  });

  it('puts back a message that was never sent', () => {
    render(
      <ChatInput isStreaming={false} onSend={vi.fn()} draftKey="new:chat" />,
    );

    act(() =>
      composerStore.fill({ key: 'new:chat', text: 'Build a flow', files: [] }),
    );

    expect(textarea().value).toBe('Build a flow');
  });
});

describe('ChatInput secret warning', () => {
  it('warns on a pasted key and removes it', () => {
    render(<ChatInput isStreaming={false} onSend={vi.fn()} />);

    fireEvent.paste(textarea(), {
      clipboardData: { getData: () => SECRET },
    });
    type(`use ${SECRET} please`);

    expect(screen.getByRole('alert')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Remove it' }));

    expect(textarea().value).toBe('use please');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('holds a message with a key until the user confirms', () => {
    const onSend = vi.fn();
    render(<ChatInput isStreaming={false} onSend={onSend} />);

    type(`use ${SECRET}`);
    pressEnter();
    expect(onSend).not.toHaveBeenCalled();
    pressEnter();
    expect(onSend).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Send anyway' }));
    expect(onSend).toHaveBeenCalledWith(`use ${SECRET}`, undefined);
  });
});

function textarea(): HTMLTextAreaElement {
  const element = screen.getByRole('textbox');
  if (!(element instanceof HTMLTextAreaElement)) {
    throw new Error('The composer has no textarea.');
  }
  return element;
}

function type(text: string) {
  fireEvent.change(textarea(), { target: { value: text } });
}

function pressEnter() {
  fireEvent.keyDown(textarea(), { key: 'Enter' });
}

const SECRET = 'sk-proj-abcdefghijklmnop1234';
