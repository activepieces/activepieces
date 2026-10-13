import { McpOAuthGrant } from '@activepieces/shared';
import { t } from 'i18next';

import { formatUtils } from '@/lib/format-utils';

function label(grants: McpOAuthGrant[]): string {
  return latestUse(grants) ? usage(grants) : t('Connected');
}

function usage(grants: McpOAuthGrant[]): string {
  const lastUsed = latestUse(grants);
  return lastUsed
    ? t('Used {ago}', { ago: formatUtils.formatDateToAgo(new Date(lastUsed)) })
    : t('No calls yet');
}

function latestUse(grants: McpOAuthGrant[]): string | undefined {
  return grants
    .map((grant) => grant.lastUsedAt)
    .filter((value): value is string => value !== null)
    .sort()
    .at(-1);
}

export const connectStatus = { label, usage };
