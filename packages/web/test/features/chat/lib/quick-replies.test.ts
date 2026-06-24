import { describe, expect, it } from 'vitest';

import { ChatUIMessage, chatPartUtils } from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';

function quickRepliesMessage(
  input: { replies?: string[]; offerRecurringAutomation?: boolean },
  state: 'input-available' | 'output-available' = 'output-available',
): ChatUIMessage {
  return {
    id: 'assistant-1',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'All done.' },
      {
        type: 'tool-ap_show_quick_replies',
        toolCallId: 'call-1',
        state,
        input,
        ...(state === 'output-available' ? { output: { displayed: true } } : {}),
      },
    ],
  } as ChatUIMessage;
}

describe('quick replies extraction', () => {
  describe('extractQuickRepliesFromParts', () => {
    it('returns replies with offerRecurringAutomation false by default', () => {
      const result = chatPartUtils.extractQuickRepliesFromParts(
        quickRepliesMessage({ replies: ['A', 'B'] }),
      );
      expect(result).toEqual({
        replies: ['A', 'B'],
        offerRecurringAutomation: false,
      });
    });

    it('surfaces offerRecurringAutomation when set', () => {
      const result = chatPartUtils.extractQuickRepliesFromParts(
        quickRepliesMessage({ replies: ['A'], offerRecurringAutomation: true }),
      );
      expect(result.offerRecurringAutomation).toBe(true);
      expect(result.replies).toEqual(['A']);
    });

    it('reads from input-available (streaming) parts too', () => {
      const result = chatPartUtils.extractQuickRepliesFromParts(
        quickRepliesMessage(
          { replies: ['A'], offerRecurringAutomation: true },
          'input-available',
        ),
      );
      expect(result.offerRecurringAutomation).toBe(true);
    });

    it('returns empty for a non-assistant message', () => {
      const result = chatPartUtils.extractQuickRepliesFromParts({
        id: 'u1',
        role: 'user',
        parts: [{ type: 'text', text: 'hi' }],
      } as ChatUIMessage);
      expect(result).toEqual({ replies: [], offerRecurringAutomation: false });
    });
  });

  describe('extractQuickRepliesFromHistory', () => {
    it('reads replies and the recurring flag from the last message', () => {
      const result = chatUtils.extractQuickRepliesFromHistory([
        quickRepliesMessage({ replies: ['A', 'B'], offerRecurringAutomation: true }),
      ]);
      expect(result).toEqual({
        replies: ['A', 'B'],
        offerRecurringAutomation: true,
      });
    });

    it('returns empty when there is no quick-replies part', () => {
      const result = chatUtils.extractQuickRepliesFromHistory([
        {
          id: 'a1',
          role: 'assistant',
          parts: [{ type: 'text', text: 'no chips' }],
        } as ChatUIMessage,
      ]);
      expect(result).toEqual({ replies: [], offerRecurringAutomation: false });
    });
  });
});
