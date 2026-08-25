import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { ChatUIMessage, chatPartUtils } from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';

function readFromWeb(relative: string): string {
  return readFileSync(path.join(process.cwd(), relative), 'utf8');
}

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

  // The chip text, the message sent on click, and the agent's trigger phrase are
  // the same literal in 3 files. This guards against a rename silently breaking it.
  describe('recurring-automation trigger phrase contract', () => {
    it('matches the phrase the prompt guides watch for', () => {
      const component = readFromWeb(
        'src/app/routes/chat-with-ai/components/recurring-chip.tsx',
      );
      const phrase = component.match(
        /RECURRING_AUTOMATION_REPLY = '([^']+)'/,
      )?.[1];
      expect(phrase).toBeTruthy();

      const guides = [
        '../server/api/src/assets/prompts/guides/one_time_task.md',
        '../server/api/src/assets/prompts/guides/build_flow.md',
      ];
      for (const guide of guides) {
        expect(readFromWeb(guide)).toContain(phrase!);
      }
    });
  });
});
