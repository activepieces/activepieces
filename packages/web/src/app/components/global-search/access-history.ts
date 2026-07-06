import { authenticationSession } from '@/lib/authentication-session';

const MAX_ITEMS = 50;
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

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
    const items = JSON.parse(raw) as AccessedItem[];
    const cutoff = Date.now() - EXPIRY_MS;
    return items.filter((item) => item.accessedAt >= cutoff);
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
