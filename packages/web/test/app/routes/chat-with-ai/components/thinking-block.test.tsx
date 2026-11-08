/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThinkingBlock } from '@/app/routes/chat-with-ai/components/activity-accordion';
import { MessageSources } from '@/app/routes/chat-with-ai/components/message-sources';
import { AnyToolPart, ThinkingStep } from '@/features/chat/lib/chat-types';

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params && 'count' in params ? `${key}#${String(params.count)}` : key,
}));
vi.mock('@/features/pieces/hooks/pieces-hooks', () => ({
  piecesHooks: {
    usePieceSummariesByNames: () => ({ summaries: [] }),
  },
}));

afterEach(() => {
  cleanup();
});

describe('ThinkingBlock', () => {
  it('folds a finished round into one "Checked N things" line', () => {
    render(
      <ThinkingBlock
        thinkingSteps={[
          { kind: 'reasoning', text: 'Need the inbox first.' },
          toolStep({ id: 'a', done: true }),
          toolStep({ id: 'b', done: true }),
        ]}
        isStreaming={false}
      />,
    );

    expect(
      screen.getByText(
        'Checked {count} {count, plural, =1 {thing} other {things}}#2',
      ),
    ).toBeTruthy();
    expect(screen.queryByText('Need the inbox first.')).toBeNull();
  });

  it('keeps a failed step visible while folded', () => {
    render(
      <ThinkingBlock
        thinkingSteps={[
          toolStep({ id: 'a', done: true }),
          toolStep({ id: 'b', error: 'The bot is not in the channel' }),
        ]}
        isStreaming={false}
      />,
    );

    expect(screen.getByText('· The bot is not in the channel')).toBeTruthy();
  });

  it('shows one live line while streaming', () => {
    const { container } = render(
      <ThinkingBlock
        thinkingSteps={[
          { kind: 'thinking-status', text: 'Planning the welcome note' },
        ]}
        isStreaming
      />,
    );

    expect(screen.getByText('Planning the welcome note')).toBeTruthy();
    expect(container.querySelectorAll('button[aria-expanded]')).toHaveLength(
      1,
    );
  });

  it('opens to the step lines', () => {
    render(
      <ThinkingBlock
        thinkingSteps={[
          { kind: 'reasoning', text: 'Need the inbox first.' },
          toolStep({ id: 'a', done: true }),
        ]}
        isStreaming={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByText('Need the inbox first.')).toBeTruthy();
  });
});

describe('MessageSources', () => {
  it('shows 3 sources and a "+N more" button for the rest', () => {
    render(
      <MessageSources
        sources={['a', 'b', 'c', 'd', 'e'].map((name) => ({
          key: name,
          title: `Source ${name}`,
        }))}
      />,
    );

    expect(screen.queryByText('Source d')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '+{count} more#2' }));
    expect(screen.getByText('Source e')).toBeTruthy();
  });
});

function toolStep({
  id,
  done = false,
  error,
}: {
  id: string;
  done?: boolean;
  error?: string;
}): ThinkingStep {
  const part: AnyToolPart = error
    ? {
        type: 'dynamic-tool',
        toolName: 'ap_search_pieces',
        toolCallId: id,
        input: { query: 'gmail' },
        state: 'output-error',
        errorText: error,
      }
    : done
    ? {
        type: 'dynamic-tool',
        toolName: 'ap_search_pieces',
        toolCallId: id,
        input: { query: 'gmail' },
        state: 'output-available',
        output: { pieces: [] },
      }
    : {
        type: 'dynamic-tool',
        toolName: 'ap_search_pieces',
        toolCallId: id,
        input: { query: 'gmail' },
        state: 'input-available',
      };
  return { kind: 'tool', part, description: null };
}
