/**
 * @vitest-environment jsdom
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatInput } from '@/app/routes/chat-with-ai/components/chat-input';
import { chatDom } from '@/features/chat/lib/chat-dom';
import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';
import { chatPanelUtils } from '@/features/workspace/lib/chat-panel-open';

const voice = vi.hoisted(() => ({
  isRecording: false,
  cancelRecording: vi.fn(),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/chat/lib/use-voice-input', () => ({
  useVoiceInput: () => ({
    isRecording: voice.isRecording,
    isSupported: true,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    cancelRecording: voice.cancelRecording,
  }),
}));

describe('ChatInput queue', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    );
    voice.isRecording = false;
    voice.cancelRecording.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('does not send a message queued in one chat into the chat switched to', () => {
    const onSend = vi.fn();
    const view = renderInput({ isStreaming: true, chatSession: 1, onSend });
    queueMessage('Follow up for A');

    view.rerender(input({ isStreaming: false, chatSession: 2, onSend }));

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.queryByText('Follow up for A')).toBeNull();
  });

  it('sends the queued message once when the reply ends', () => {
    const onSend = vi.fn();
    const view = renderInput({ isStreaming: true, chatSession: 1, onSend });
    queueMessage('Then do this');

    view.rerender(input({ isStreaming: false, chatSession: 1, onSend }));
    view.rerender(input({ isStreaming: false, chatSession: 1, onSend }));

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith('Then do this', undefined);
  });

  it('puts the text back in the composer on Cancel', () => {
    const onSend = vi.fn();
    renderInput({ isStreaming: true, chatSession: 1, onSend });
    queueMessage('Never mind');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(composer().value).toBe('Never mind');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('moves the queued text back with a reason when a card asks for an answer', () => {
    const onSend = vi.fn();
    const view = renderInput({ isStreaming: true, chatSession: 1, onSend });
    queueMessage('Use the sales sheet');

    view.rerender(
      input({
        isStreaming: false,
        replying: true,
        holdQueued: true,
        chatSession: 1,
        onSend,
      }),
    );

    expect(composer().value).toBe('Use the sales sheet');
    expect(
      screen.getByText(
        'Moved back to the composer because the AI is waiting for your answer.',
      ),
    ).toBeTruthy();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('says a message is already waiting when Enter is pressed again', () => {
    const onSend = vi.fn();
    renderInput({ isStreaming: true, chatSession: 1, onSend });
    queueMessage('First');
    fireEvent.change(composer(), { target: { value: 'Second' } });
    fireEvent.keyDown(composer(), { key: 'Enter' });

    expect(
      screen.getByText('One message is already waiting. Cancel it to change it.'),
    ).toBeTruthy();
    expect(screen.getByText('First')).toBeTruthy();
    expect(composer().value).toBe('Second');
  });

  it('carries the queued text into the new chat composer on New chat', () => {
    const onSend = vi.fn();
    const view = renderInput({ isStreaming: true, chatSession: 1, onSend });
    queueMessage('Keep me');

    act(() => chatPanelUtils.createStore().getState().newChat());
    view.unmount();
    renderInput({ isStreaming: false, chatSession: 0, onSend });

    expect(composer().value).toBe('Keep me');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('puts the queued text back when sending is blocked as the reply ends', () => {
    const onSend = vi.fn();
    const view = renderInput({ isStreaming: true, chatSession: 1, onSend });
    queueMessage('Then do this');

    view.rerender(
      input({
        isStreaming: false,
        chatSession: 1,
        onSend,
        sendBlockedReason: 'Pick another model to continue',
      }),
    );

    expect(onSend).not.toHaveBeenCalled();
    expect(composer().value).toBe('Then do this');
  });

  it('claims Escape while recording so it does not also stop the reply', () => {
    voice.isRecording = true;
    renderInput({ isStreaming: false, chatSession: 1, onSend: vi.fn() });
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });

    document.body.dispatchEvent(event);

    expect(voice.cancelRecording).toHaveBeenCalledTimes(1);
    expect(chatDom.escapeFree(event)).toBe(false);
  });
});

function input({
  isStreaming,
  replying,
  holdQueued,
  chatSession,
  onSend,
  sendBlockedReason,
}: {
  isStreaming: boolean;
  replying?: boolean;
  holdQueued?: boolean;
  chatSession: number;
  onSend: (text: string, files?: File[]) => void;
  sendBlockedReason?: string;
}) {
  return (
    <div id={chatLayoutUtils.PANEL_ID}>
      <ChatInput
        isStreaming={isStreaming}
        replying={replying ?? isStreaming}
        holdQueued={holdQueued}
        chatSession={chatSession}
        onSend={onSend}
        onStop={vi.fn()}
        sendBlockedReason={sendBlockedReason}
      />
    </div>
  );
}

function renderInput(props: Parameters<typeof input>[0]) {
  return render(input(props));
}

function composer(): HTMLTextAreaElement {
  const textarea = document.querySelector('textarea');
  if (!(textarea instanceof HTMLTextAreaElement)) {
    throw new Error('composer not rendered');
  }
  return textarea;
}

function queueMessage(text: string) {
  fireEvent.change(composer(), { target: { value: text } });
  fireEvent.keyDown(composer(), { key: 'Enter' });
}
