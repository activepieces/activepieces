import { isNil } from '@activepieces/core-utils';
import { AiProviderKeyStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, CloudOff, CreditCard, LucideIcon, X } from 'lucide-react';

import { StatusIconWithText } from '@/components/custom/status-icon-with-text';

export function KeyStatusBadge({ status }: { status: AiProviderKeyStatus }) {
  const badge = badgeOf({ status });
  if (isNil(badge)) {
    return null;
  }
  return (
    <StatusIconWithText
      icon={badge.icon}
      text={badge.text}
      variant={badge.variant}
    />
  );
}

function badgeOf({ status }: { status: AiProviderKeyStatus }): {
  icon: LucideIcon;
  text: string;
  variant: 'success' | 'warning' | 'error' | 'secondary';
} | null {
  switch (status) {
    case 'active':
      return { icon: Check, text: t('Active'), variant: 'success' };
    case 'out_of_credits':
      return {
        icon: CreditCard,
        text: t('Out of credits'),
        variant: 'warning',
      };
    case 'rejected':
      return { icon: X, text: t('Key rejected'), variant: 'error' };
    case 'unreachable':
      return { icon: CloudOff, text: t('Unreachable'), variant: 'secondary' };
    default:
      return null;
  }
}
