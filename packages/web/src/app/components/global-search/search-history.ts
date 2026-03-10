import { authenticationSession } from '@/lib/authentication-session';

export type SearchHistoryItemType =
  | 'flow'
  | 'table'
  | 'folder'
  | 'project'
  | 'page';

export type SearchHistoryItem = {
  id: string;
  type: SearchHistoryItemType;
  label: string;
  href: string;
  status?: 'ENABLED' | 'DISABLED' | null;
  folderName?: string | null;
  projectName?: string | null;
  iconBgColor?: string;
  iconTextColor?: string;
  iconLetter?: string;
  searchedAt: number;
};

export type HistoryGroup = {
  label: string;
  items: SearchHistoryItem[];
};

const MAX_ITEMS = 30;
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function getKey(): string {
  const userId = authenticationSession.getCurrentUserId();
  return `ap-global-search-history-${userId ?? 'anon'}`;
}

export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(getKey());
    if (!raw) return [];
    const items = JSON.parse(raw) as SearchHistoryItem[];
    const cutoff = Date.now() - EXPIRY_MS;
    return items.filter((item) => item.searchedAt > cutoff);
  } catch {
    return [];
  }
}

export function addToSearchHistory(
  item: Omit<SearchHistoryItem, 'searchedAt'>,
): void {
  try {
    const existing = getSearchHistory();
    const filtered = existing.filter((h) => h.id !== item.id);
    const updated = [{ ...item, searchedAt: Date.now() }, ...filtered].slice(
      0,
      MAX_ITEMS,
    );
    localStorage.setItem(getKey(), JSON.stringify(updated));
  } catch {
    // ignore localStorage errors
  }
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(getKey());
  } catch {
    // ignore
  }
}

export function groupHistoryByTime(items: SearchHistoryItem[]): HistoryGroup[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const yesterdayMs = todayMs - 86_400_000;
  const lastWeekMs = todayMs - 7 * 86_400_000;

  const groups: HistoryGroup[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Last week', items: [] },
    { label: 'Older', items: [] },
  ];

  for (const item of items) {
    if (item.searchedAt >= todayMs) {
      groups[0].items.push(item);
    } else if (item.searchedAt >= yesterdayMs) {
      groups[1].items.push(item);
    } else if (item.searchedAt >= lastWeekMs) {
      groups[2].items.push(item);
    } else {
      groups[3].items.push(item);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}
