import { t } from 'i18next';

import { type AccessedItem, getAccessHistory } from './access-history';
import { STATIC_PAGES } from './static-pages';
import {
  type SearchResultGroup,
  type SearchResultItem,
} from './use-global-search-results';

function getTimePeriod(
  timestamp: number,
): 'today' | 'yesterday' | 'last-week' | 'last-30-days' {
  const now = new Date();
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDay = new Date(timestamp);
  const itemDayStart = new Date(
    itemDay.getFullYear(),
    itemDay.getMonth(),
    itemDay.getDate(),
  );
  const diffDays = Math.floor(
    (nowDay.getTime() - itemDayStart.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays <= 7) return 'last-week';
  return 'last-30-days';
}

function toSearchResultItem(item: AccessedItem): SearchResultItem {
  return {
    id: item.id,
    type: item.type,
    label: item.label,
    href: item.href,
    status: item.status,
    folderName: item.folderName,
    projectName: item.projectName,
    iconBgColor: item.iconBgColor,
    iconTextColor: item.iconTextColor,
    iconLetter: item.iconLetter,
    pageIcon:
      item.type === 'page'
        ? STATIC_PAGES.find((p) => p.id === item.id)?.icon
        : undefined,
  };
}

export function buildRecentGroups({
  hideTables,
}: {
  hideTables: boolean;
}): SearchResultGroup[] {
  const history = hideTables
    ? getAccessHistory().filter((h) => h.type !== 'table')
    : getAccessHistory();
  if (history.length === 0) {
    return [];
  }

  const buckets: Record<string, SearchResultItem[]> = {
    today: [],
    yesterday: [],
    'last-week': [],
    'last-30-days': [],
  };
  for (const item of history) {
    buckets[getTimePeriod(item.accessedAt)].push(toSearchResultItem(item));
  }

  const periodDefs = [
    { key: 'today', label: t('Today') },
    { key: 'yesterday', label: t('Yesterday') },
    { key: 'last-week', label: t('Last Week') },
    { key: 'last-30-days', label: t('Last 30 Days') },
  ];

  return periodDefs
    .filter((p) => buckets[p.key].length > 0)
    .map((p) => ({
      type: `history-${p.key}`,
      heading: p.label,
      items: buckets[p.key],
      isLoading: false,
    }));
}
