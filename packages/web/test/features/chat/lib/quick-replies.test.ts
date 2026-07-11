import { DynamicToolUIPart } from 'ai';
import { describe, expect, it } from 'vitest';

import { chatPartUtils, ChatUIMessage } from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';

function quickRepliesPart(input: unknown): DynamicToolUIPart {
  return {
    type: 'dynamic-tool',
    toolCallId: 't1',
    toolName: 'ap_show_quick_replies',
    state: 'output-available',
    input,
    output: JSON.stringify({ displayed: true }),
  };
}

function assistantMessage(parts: ChatUIMessage['parts']): ChatUIMessage {
  return { id: 'm1', role: 'assistant', parts };
}

function userMessage(text: string): ChatUIMessage {
  return { id: 'u1', role: 'user', parts: [{ type: 'text', text }] };
}

describe('extractQuickRepliesFromParts', () => {
  it('returns empty replies for null or non-assistant messages', () => {
    expect(chatPartUtils.extractQuickRepliesFromParts(null)).toEqual({
      replies: [],
    });
    expect(
      chatPartUtils.extractQuickRepliesFromParts(userMessage('hey')),
    ).toEqual({ replies: [] });
  });

  it('extracts replies and a well-formed automation suggestion', () => {
    const msg = assistantMessage([
      quickRepliesPart({
        replies: ['Draft the follow-ups', 'Show me stalled deals'],
        automationSuggestion: {
          label: 'Never chase deals by hand again',
          prompt: 'Set this up to run automatically for me',
        },
      }),
    ]);
    expect(chatPartUtils.extractQuickRepliesFromParts(msg)).toEqual({
      replies: ['Draft the follow-ups', 'Show me stalled deals'],
      automationSuggestion: {
        label: 'Never chase deals by hand again',
        prompt: 'Set this up to run automatically for me',
      },
    });
  });

  it('drops a malformed automation suggestion but keeps replies', () => {
    const msg = assistantMessage([
      quickRepliesPart({
        replies: ['Do X'],
        automationSuggestion: { label: 'Missing prompt' },
      }),
    ]);
    expect(chatPartUtils.extractQuickRepliesFromParts(msg)).toEqual({
      replies: ['Do X'],
    });
  });

  it('filters out non-string replies', () => {
    const msg = assistantMessage([
      quickRepliesPart({ replies: ['keep', 42, null, 'also'] }),
    ]);
    expect(chatPartUtils.extractQuickRepliesFromParts(msg)).toEqual({
      replies: ['keep', 'also'],
    });
  });

  it('returns empty replies when there is no quick-replies part', () => {
    const msg = assistantMessage([{ type: 'text', text: 'hello' }]);
    expect(chatPartUtils.extractQuickRepliesFromParts(msg)).toEqual({
      replies: [],
    });
  });
});

describe('extractQuickRepliesFromHistory', () => {
  it('reads the last assistant message and returns the same shape', () => {
    const messages: ChatUIMessage[] = [
      assistantMessage([{ type: 'text', text: 'earlier' }]),
      userMessage('hey'),
      assistantMessage([
        quickRepliesPart({
          replies: ['Latest'],
          automationSuggestion: { label: 'Put it on autopilot', prompt: 'do it' },
        }),
      ]),
    ];
    expect(chatUtils.extractQuickRepliesFromHistory(messages)).toEqual({
      replies: ['Latest'],
      automationSuggestion: { label: 'Put it on autopilot', prompt: 'do it' },
    });
  });

  it('returns empty replies for an empty history', () => {
    expect(chatUtils.extractQuickRepliesFromHistory([])).toEqual({
      replies: [],
    });
  });
});
