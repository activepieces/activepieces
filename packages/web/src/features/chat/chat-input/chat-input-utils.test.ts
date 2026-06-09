import { describe, expect, it } from 'vitest';

import { chatInputUtils } from './chat-input-utils';

describe('chatInputUtils.canSubmitMessage', () => {
  it('requires non-empty message text', () => {
    expect(
      chatInputUtils.canSubmitMessage({
        disabled: false,
        textContent: '',
      }),
    ).toBe(false);
  });

  it('rejects whitespace-only message text', () => {
    expect(
      chatInputUtils.canSubmitMessage({
        disabled: false,
        textContent: '   ',
      }),
    ).toBe(false);
  });

  it('allows non-empty message text', () => {
    expect(
      chatInputUtils.canSubmitMessage({
        disabled: false,
        textContent: 'hello',
      }),
    ).toBe(true);
  });

  it('does not allow sending while disabled', () => {
    expect(
      chatInputUtils.canSubmitMessage({
        disabled: true,
        textContent: 'hello',
      }),
    ).toBe(false);
  });
});
