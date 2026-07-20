import { ChatMentionType } from '@activepieces/shared';
import { describe, it, expect } from 'vitest';

import { mentionSerialization } from '@/app/routes/chat-with-ai/components/mention-composer/mention-serialization';

function mentionNode(attrs: { mentionType: string; entityId: string; label: string }) {
  return { type: 'mention', attrs };
}

describe('mentionSerialization.editorJsonToValue', () => {
  it('serializes plain text with no mentions', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello world' }] }],
    };
    expect(mentionSerialization.editorJsonToValue(doc)).toEqual({
      content: 'hello world',
      mentions: [],
    });
  });

  it('serializes a mention into a token and collects it', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'check ' },
            mentionNode({ mentionType: ChatMentionType.FLOW, entityId: 'fl_1', label: 'Onboarding' }),
            { type: 'text', text: ' please' },
          ],
        },
      ],
    };
    const result = mentionSerialization.editorJsonToValue(doc);
    expect(result.content).toBe('check @[flow:fl_1:Onboarding] please');
    expect(result.mentions).toEqual([
      { type: ChatMentionType.FLOW, id: 'fl_1', label: 'Onboarding' },
    ]);
  });

  it('dedupes repeated mentions of the same entity', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            mentionNode({ mentionType: ChatMentionType.TABLE, entityId: 't_1', label: 'Leads' }),
            { type: 'text', text: ' and ' },
            mentionNode({ mentionType: ChatMentionType.TABLE, entityId: 't_1', label: 'Leads' }),
          ],
        },
      ],
    };
    const result = mentionSerialization.editorJsonToValue(doc);
    expect(result.mentions).toHaveLength(1);
  });

  it('joins multiple paragraphs with newlines', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'line1' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'line2' }] },
      ],
    };
    expect(mentionSerialization.editorJsonToValue(doc).content).toBe('line1\nline2');
  });
});

describe('mentionSerialization.parseTokens', () => {
  it('round-trips tokens back into text + mention segments', () => {
    const content = 'check @[app:@activepieces/piece-slack:Slack] now';
    const segments = mentionSerialization.parseTokens(content);
    expect(segments).toEqual([
      { kind: 'text', value: 'check ' },
      {
        kind: 'mention',
        mention: { type: ChatMentionType.APP, id: '@activepieces/piece-slack', label: 'Slack' },
      },
      { kind: 'text', value: ' now' },
    ]);
  });

  it('returns a single text segment when there are no tokens', () => {
    const segments = mentionSerialization.parseTokens('just text');
    expect(segments).toEqual([{ kind: 'text', value: 'just text' }]);
  });
});
