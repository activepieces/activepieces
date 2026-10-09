/**
 * @vitest-environment jsdom
 */
import { ErrorCode } from '@activepieces/core-utils';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChatMessageList } from '@/features/chat';

describe('flow chat error bubble', () => {
  it('resends the failed message when the retry button is clicked', () => {
    const sendMessage = vi.fn();
    render(
      <ChatMessageList
        messages={[{ role: 'user', textContent: 'hello' }]}
        sendingError={{ code: ErrorCode.NO_CHAT_RESPONSE, params: {} }}
        isSending={false}
        flowId="flow-1"
        sendMessage={sendMessage}
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({ isRetrying: true });
  });
});
