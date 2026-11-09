import { AgentConversation, AgentRunSource } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import { chatHistoryUtils } from '@/features/chat/lib/chat-history-utils';

vi.mock('i18next', () => ({
  default: { language: 'en-US' },
  t: (key: string) => key,
}));

const NOW = new Date(2026, 5, 10, 15, 0, 0);

describe('chatHistoryUtils.shortTime', () => {
  it('uses short relative times today', () => {
    expect(at(new Date(2026, 5, 10, 14, 59, 40))).toBe('Now');
    expect(at(new Date(2026, 5, 10, 14, 55, 0))).toBe('5m');
    expect(at(new Date(2026, 5, 10, 13, 0, 0))).toBe('2h');
  });

  it('says Yesterday, then a short date', () => {
    expect(at(new Date(2026, 5, 9, 9, 0, 0))).toBe('Yesterday');
    expect(at(new Date(2026, 5, 3, 9, 0, 0))).toBe('Jun 3');
    expect(at(new Date(2025, 5, 3, 9, 0, 0))).toBe('Jun 3, 2025');
  });
});

describe('chatHistoryUtils.showsSearch', () => {
  it('shows search only above the threshold or while a query is typed', () => {
    expect(chatHistoryUtils.showsSearch({ total: 8, query: '' })).toBe(false);
    expect(chatHistoryUtils.showsSearch({ total: 9, query: '' })).toBe(true);
    expect(chatHistoryUtils.showsSearch({ total: 0, query: 'x' })).toBe(true);
  });
});

describe('chatHistoryUtils.filterByTitle', () => {
  it('matches titles case-blind and keeps all chats for a blank query', () => {
    const chats = [titled('Weekly leads'), titled('MRR report'), titled(null)];

    expect(
      chatHistoryUtils
        .filterByTitle({ conversations: chats, query: '  LEADS ' })
        .map((chat) => chat.title),
    ).toEqual(['Weekly leads']);
    expect(
      chatHistoryUtils.filterByTitle({ conversations: chats, query: '  ' }),
    ).toBe(chats);
  });
});

describe('chatHistoryUtils.recentChats', () => {
  const chats = ['a', 'b', 'c', 'd'].map((title) => titled(title));
  const ids = (list: AgentConversation[]) => list.map((c) => c.id);

  it('keeps the top chats when the current one is among them', () => {
    expect(
      ids(
        chatHistoryUtils.recentChats({
          conversations: chats,
          currentId: 'b',
          count: 2,
        }),
      ),
    ).toEqual(['a', 'b']);
  });

  it('puts the current chat first when it sits below the top', () => {
    expect(
      ids(
        chatHistoryUtils.recentChats({
          conversations: chats,
          currentId: 'd',
          count: 2,
        }),
      ),
    ).toEqual(['d', 'a']);
  });

  it('keeps the top chats when the current one is not loaded or there is none', () => {
    expect(
      ids(
        chatHistoryUtils.recentChats({
          conversations: chats,
          currentId: 'zz',
          count: 2,
        }),
      ),
    ).toEqual(['a', 'b']);
    expect(
      ids(
        chatHistoryUtils.recentChats({
          conversations: chats,
          currentId: null,
          count: 2,
        }),
      ),
    ).toEqual(['a', 'b']);
  });
});

describe('chatHistoryUtils by last activity', () => {
  it('orders and groups chats by their last activity, not when they began', () => {
    const oldButActive = chat({
      id: 'old',
      created: new Date(2026, 4, 1, 9, 0, 0),
      updated: new Date(2026, 5, 10, 14, 0, 0),
    });
    const newButQuiet = chat({
      id: 'new',
      created: new Date(2026, 5, 9, 9, 0, 0),
      updated: new Date(2026, 5, 9, 9, 5, 0),
    });

    const ordered = chatHistoryUtils.byLastActivity([
      newButQuiet,
      oldButActive,
    ]);
    expect(ordered.map((conversation) => conversation.id)).toEqual([
      'old',
      'new',
    ]);
    expect(
      chatHistoryUtils
        .groupByDay({ conversations: ordered, now: NOW })
        .map((group) => [
          group.id,
          group.conversations.map((conversation) => conversation.id),
        ]),
    ).toEqual([
      ['today', ['old']],
      ['yesterday', ['new']],
    ]);
  });
});

function chat({
  id,
  created,
  updated,
}: {
  id: string;
  created: Date;
  updated: Date;
}): AgentConversation {
  return AgentConversation.parse({
    id,
    created: created.toISOString(),
    updated: updated.toISOString(),
    platformId: 'platform-1',
    userId: 'user-1',
    source: AgentRunSource.CHAT,
    title: id,
  });
}

function titled(title: string | null): AgentConversation {
  return AgentConversation.parse({
    id: title ?? 'untitled',
    created: NOW.toISOString(),
    updated: NOW.toISOString(),
    platformId: 'platform-1',
    userId: 'user-1',
    source: AgentRunSource.CHAT,
    title,
  });
}

function at(date: Date): string {
  return chatHistoryUtils.shortTime({ date, now: NOW });
}
