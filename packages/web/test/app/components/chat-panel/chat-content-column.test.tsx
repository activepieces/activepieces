/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatContentColumn } from '@/app/components/chat-panel/chat-content-column';
import { ChatWidth } from '@/features/workspace/lib/chat-layout';
import { pageColumnUtils } from '@/lib/page-column-utils';

const chat = vi.hoisted((): { width: ChatWidth } => ({ width: 'closed' }));

vi.mock('@/app/components/chat-panel/chat-window', () => ({
  useChatWidth: () => chat.width,
}));

describe('ChatContentColumn', () => {
  afterEach(cleanup);

  it('takes the page out of reach while the phone chat sheet is open', () => {
    chat.width = 'sheet';
    renderColumn();

    expect(pageColumn()?.hasAttribute('inert')).toBe(true);
  });

  it('keeps the page usable beside a docked chat', () => {
    chat.width = 'left';
    renderColumn();

    expect(pageColumn()?.hasAttribute('inert')).toBe(false);
  });
});

function pageColumn() {
  return document.getElementById(pageColumnUtils.ID);
}

function renderColumn() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ChatContentColumn>
        <p>Page</p>
      </ChatContentColumn>
    </QueryClientProvider>,
  );
}
