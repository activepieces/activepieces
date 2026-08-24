import { McpOAuthGrant } from '@activepieces/shared';
import i18next, { t } from 'i18next';

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatLastUsed(row: McpOAuthGrant): LastUsed {
  if (row.lastUsedAt === null) {
    return { label: t('Never used'), isActiveToday: false };
  }
  const lastUsedAt = new Date(row.lastUsedAt);
  if (isToday(lastUsedAt)) {
    return { label: t('Active today'), isActiveToday: true };
  }
  return {
    label: t('Last used {date}', {
      date: Intl.DateTimeFormat(i18next.language, {
        month: 'short',
        day: 'numeric',
      }).format(lastUsedAt),
    }),
    isActiveToday: false,
  };
}

export const grantUtils = { formatLastUsed };

export type LastUsed = {
  label: string;
  isActiveToday: boolean;
};
