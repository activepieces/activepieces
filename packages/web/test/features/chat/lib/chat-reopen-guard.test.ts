import { describe, expect, it } from 'vitest';

import { chatUtils } from '@/features/chat/lib/chat-utils';

describe('chatUtils.reopensSameConversation', () => {
  it('is true for the id the chat is already in, which must not reload and kill the stream', () => {
    expect(
      chatUtils.reopensSameConversation({ current: 'conv_1', next: 'conv_1' }),
    ).toBe(true);
  });

  it('is false when switching to a different conversation, which must reload', () => {
    expect(
      chatUtils.reopensSameConversation({ current: 'conv_1', next: 'conv_2' }),
    ).toBe(false);
  });

  it('is false for the first conversation of a fresh chat box', () => {
    expect(
      chatUtils.reopensSameConversation({ current: null, next: 'conv_1' }),
    ).toBe(false);
  });

  it('does not treat a null current as matching an empty id', () => {
    expect(chatUtils.reopensSameConversation({ current: null, next: '' })).toBe(
      false,
    );
  });

  it('is case-sensitive, because ids are opaque and case-significant', () => {
    expect(
      chatUtils.reopensSameConversation({ current: 'Conv_1', next: 'conv_1' }),
    ).toBe(false);
  });
});
