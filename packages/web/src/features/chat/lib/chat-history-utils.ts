import { AgentConversation } from '@activepieces/shared';
import i18next, { t } from 'i18next';

function groupByDay({
  conversations,
  now,
}: {
  conversations: AgentConversation[];
  now: Date;
}): ChatHistoryGroup[] {
  const buckets: Record<ChatHistoryGroupId, AgentConversation[]> = {
    today: [],
    yesterday: [],
    week: [],
    older: [],
  };
  for (const conversation of conversations) {
    buckets[groupOf({ date: lastActivity(conversation), now })].push(
      conversation,
    );
  }
  return GROUP_ORDER.filter((id) => buckets[id].length > 0).map((id) => ({
    id,
    label: groupLabel(id),
    conversations: buckets[id],
  }));
}

function byLastActivity(
  conversations: AgentConversation[],
): AgentConversation[] {
  return [...conversations].sort(
    (a, b) => lastActivity(b).getTime() - lastActivity(a).getTime(),
  );
}

function lastActivity(conversation: AgentConversation): Date {
  return new Date(conversation.updated);
}

function groupOf({ date, now }: { date: Date; now: Date }): ChatHistoryGroupId {
  const days = daysBetween({ date, now });
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days <= 7) return 'week';
  return 'older';
}

function groupLabel(id: ChatHistoryGroupId): string {
  switch (id) {
    case 'today':
      return t('Today');
    case 'yesterday':
      return t('Yesterday');
    case 'week':
      return t('Previous 7 days');
    case 'older':
      return t('Older');
  }
}

function shortTime({ date, now }: { date: Date; now: Date }): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / MINUTE_MS);
  const days = daysBetween({ date, now });
  if (days <= 0) {
    if (minutes < 1) return t('Now');
    if (minutes < 60) return narrowUnit({ value: minutes, unit: 'minute' });
    return narrowUnit({ value: Math.floor(minutes / 60), unit: 'hour' });
  }
  if (days === 1) return t('Yesterday');
  return new Intl.DateTimeFormat(i18next.language, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(date);
}

function narrowUnit({
  value,
  unit,
}: {
  value: number;
  unit: 'minute' | 'hour';
}): string {
  return new Intl.NumberFormat(i18next.language, {
    style: 'unit',
    unit,
    unitDisplay: 'narrow',
  }).format(value);
}

function daysBetween({ date, now }: { date: Date; now: Date }): number {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - start.getTime()) / DAY_MS);
}

function showsSearch({
  total,
  query,
}: {
  total: number;
  query: string;
}): boolean {
  return total > SEARCH_THRESHOLD || query.length > 0;
}

function filterByTitle({
  conversations,
  query,
}: {
  conversations: AgentConversation[];
  query: string;
}): AgentConversation[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return conversations;
  return conversations.filter((conversation) =>
    (conversation.title ?? '').toLowerCase().includes(needle),
  );
}

function recentChats({
  conversations,
  currentId,
  count,
}: {
  conversations: AgentConversation[];
  currentId: string | null;
  count: number;
}): AgentConversation[] {
  const top = conversations.slice(0, count);
  if (currentId === null || top.some((c) => c.id === currentId)) return top;
  const current = conversations.find((c) => c.id === currentId);
  if (!current) return top;
  return [current, ...conversations.slice(0, count - 1)];
}

function olderChats({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
}): OlderChats {
  if (isFetchingNextPage) return 'loading';
  if (isFetchNextPageError) return 'failed';
  return hasNextPage ? 'available' : 'none';
}

const GROUP_ORDER: ChatHistoryGroupId[] = [
  'today',
  'yesterday',
  'week',
  'older',
];
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const SEARCH_THRESHOLD = 8;

export const chatHistoryUtils = {
  groupByDay,
  byLastActivity,
  lastActivity,
  shortTime,
  showsSearch,
  filterByTitle,
  recentChats,
  olderChats,
};

export type OlderChats = 'none' | 'available' | 'loading' | 'failed';

type ChatHistoryGroupId = 'today' | 'yesterday' | 'week' | 'older';

type ChatHistoryGroup = {
  id: ChatHistoryGroupId;
  label: string;
  conversations: AgentConversation[];
};
