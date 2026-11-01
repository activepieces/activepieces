/**
 * @vitest-environment jsdom
 */
import { ErrorCode } from '@activepieces/core-utils';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatMessageList } from '@/features/chat/chat-message-list';

vi.mock('@/components/providers/theme-provider', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

afterEach(() => {
  cleanup();
});

describe('ChatMessageList error bubble', () => {
  it('retries the failed message when Retry is clicked', () => {
    const sendMessage = vi.fn();
    render(
      <ChatMessageList
        messages={[{ role: 'user', textContent: 'hello' }]}
        flowId="flow-1"
        isSending={false}
        sendingError={{ code: ErrorCode.VALIDATION, params: { message: 'boom' } }}
        sendMessage={sendMessage}
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(sendMessage).toHaveBeenCalledWith({ isRetrying: true });
  });
});
