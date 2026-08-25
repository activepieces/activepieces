import { describe, expect, it } from 'vitest';

import { chatPartUtils } from '@/features/chat/lib/chat-types';

describe('chatPartUtils.getPendingCardKind', () => {
  it('maps action execution to an action receipt card', () => {
    expect(chatPartUtils.getPendingCardKind('ap_execute_action')).toBe(
      'action-receipt',
    );
  });

  it('maps image generation to an image card', () => {
    expect(chatPartUtils.getPendingCardKind('ap_generate_image')).toBe('image');
  });

  it('does not skeleton code execution (its recipe reveal covers the gap)', () => {
    expect(chatPartUtils.getPendingCardKind('ap_run_code')).toBeNull();
  });

  it('does not skeleton display tools or unknown tools', () => {
    expect(
      chatPartUtils.getPendingCardKind('ap_show_connection_picker'),
    ).toBeNull();
    expect(
      chatPartUtils.getPendingCardKind('ap_update_thinking_status'),
    ).toBeNull();
    expect(chatPartUtils.getPendingCardKind('mcp__whatever')).toBeNull();
  });
});
