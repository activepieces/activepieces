import { McpOAuthGrant } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';

import { formatUtils } from '@/lib/format-utils';

function formatLastUsed(row: McpOAuthGrant): LastUsed {
  if (row.lastUsedAt === null) {
    return { label: t('Never used'), isActiveToday: false };
  }
  const lastUsedAt = dayjs(row.lastUsedAt);
  const isActiveToday = lastUsedAt.isSame(dayjs(), 'day');
  return {
    label: isActiveToday
      ? t('Active today')
      : t('Last used {date}', {
          date: formatUtils.formatDate(lastUsedAt.toDate()),
        }),
    isActiveToday,
  };
}

export const grantUtils = { formatLastUsed };

export type LastUsed = {
  label: string;
  isActiveToday: boolean;
};
