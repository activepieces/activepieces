import { isNil } from '@activepieces/core-utils';
import { AiProviderKeyStatus } from '@activepieces/shared';
import { t } from 'i18next';

import { StatusDot } from '@/components/custom/status-dot';

export function KeyStatusBadge({ status }: { status: AiProviderKeyStatus }) {
  const badge = badgeOf({ status });
  if (isNil(badge)) {
    return null;
  }
  return <StatusDot tone={badge.tone}>{badge.text}</StatusDot>;
}

export function keyStatusText({
  status,
}: {
  status: AiProviderKeyStatus;
}): string | undefined {
  return badgeOf({ status })?.text;
}

function badgeOf({ status }: { status: AiProviderKeyStatus }): {
  text: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
} | null {
  switch (status) {
    case 'active':
      return { text: t('Active'), tone: 'success' };
    case 'out_of_credits':
      return { text: t('Out of credits'), tone: 'warning' };
    case 'rejected':
      return { text: t('Key rejected'), tone: 'danger' };
    case 'unreachable':
      return { text: t('Unreachable'), tone: 'neutral' };
    default:
      return null;
  }
}
