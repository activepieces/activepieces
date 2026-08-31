// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/app/routes/chat-with-ai/ai-chat-box', () => ({
  AIChatBox: (props: Record<string, unknown>) => (
    <div
      data-testid="chat"
      data-agent={String(props.agentId)}
      data-conversation={String(props.conversationId)}
      data-builder={String(props.builder)}
      data-placeholder={String(props.placeholder)}
    />
  ),
}));

import { TestPane } from '@/app/routes/agents/id';

const agent = {
  id: 'agent_1',
  displayName: 'Inbox agent',
  draft: { tools: [], instructions: 'Sort it.' },
} as never;

afterEach(cleanup);

describe('TestPane', () => {
  it('refuses to run without a model and says which thing is missing', () => {
    render(
      <TestPane
        agent={agent}
        blockedReason="Pick a model before testing"
        conversationId={null}
        onConversationCreated={vi.fn()}
        onEdited={vi.fn()}
      />,
    );

    expect(screen.getByText('Pick a model before testing')).toBeTruthy();
    expect(screen.queryByTestId('chat')).toBeNull();
  });

  it('refuses to run without instructions, so nothing unrunnable is offered', () => {
    render(
      <TestPane
        agent={agent}
        blockedReason="Write instructions before testing"
        conversationId={null}
        onConversationCreated={vi.fn()}
        onEdited={vi.fn()}
      />,
    );

    expect(screen.getByText('Write instructions before testing')).toBeTruthy();
    expect(screen.queryByTestId('chat')).toBeNull();
  });

  it('runs the agent itself, not the builder, so the test is a real agent turn', () => {
    render(
      <TestPane
        agent={agent}
        blockedReason={null}
        conversationId={null}
        onConversationCreated={vi.fn()}
        onEdited={vi.fn()}
      />,
    );

    const chat = screen.getByTestId('chat');
    expect(chat.getAttribute('data-agent')).toBe('agent_1');
    expect(chat.getAttribute('data-builder')).toBe('undefined');
  });

  it('resumes the thread it is given, so switching modes does not lose it', () => {
    render(
      <TestPane
        agent={agent}
        blockedReason={null}
        conversationId="conv_9"
        onConversationCreated={vi.fn()}
        onEdited={vi.fn()}
      />,
    );

    expect(screen.getByTestId('chat').getAttribute('data-conversation')).toBe(
      'conv_9',
    );
  });
});
