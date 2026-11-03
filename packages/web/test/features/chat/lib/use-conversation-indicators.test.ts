// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { conversationIndicatorUtils } from '@/features/chat/lib/use-conversation-indicators';

describe('seeding when each conversation was last seen', () => {
  it('treats conversations already there on the first load as seen', () => {
    const seeded = conversationIndicatorUtils.seedLastSeen({
      prev: {},
      conversations: [{ id: 'a', updated: T1 }],
      initialLoad: true,
    });
    expect(T1 > seeded.a).toBe(false);
  });

  it('shows a conversation that appears later, already finished, as unread', () => {
    const seeded = conversationIndicatorUtils.seedLastSeen({
      prev: { a: T1 },
      conversations: [
        { id: 'a', updated: T1 },
        { id: 'b', updated: T1 },
      ],
      initialLoad: false,
    });
    expect(T1 > seeded.b).toBe(true);
    expect(seeded.a).toBe(T1);
  });
});

const T1 = '2026-11-03T10:00:00.000Z';
