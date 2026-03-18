import { authenticationSession } from '@/lib/authentication-session';

const MAX_ITEMS = 50;

function getKey(): string {
  const userId = authenticationSession.getCurrentUserId();
  return `ap-access-history-${userId ?? 'anon'}`;
}

export function recordAccess(item: Omit<AccessedItem, 'accessedAt'>): void {
  try {
    const existing = getAccessHistory();
    const filtered = existing.filter((h) => h.id !== item.id);
    const updated = [{ ...item, accessedAt: Date.now() }, ...filtered].slice(
      0,
      MAX_ITEMS,
    );
    localStorage.setItem(getKey(), JSON.stringify(updated));
  } catch {
    // ignore localStorage errors
  }
}

export function getAccessHistory(): AccessedItem[] {
  try {
    const raw = localStorage.getItem(getKey());
    if (!raw) return [];
    return JSON.parse(raw) as AccessedItem[];
  } catch {
    return [];
  }
}

export function clearAccessHistory(): void {
  try {
    localStorage.removeItem(getKey());
  } catch {
    // ignore
  }
}

export type AccessedItemType = 'flow' | 'table' | 'project' | 'page';

export type AccessedItem = {
  id: string;
  type: AccessedItemType;
  label: string;
  href: string;
  accessedAt: number;
  status?: 'ENABLED' | 'DISABLED' | null;
  folderName?: string | null;
  projectName?: string | null;
  iconBgColor?: string;
  iconTextColor?: string;
  iconLetter?: string;
};
