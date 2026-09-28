import { isNil } from '@activepieces/core-utils';
import { AiProviderKeyStatus } from '@activepieces/shared';
import {
  Cancel01Icon,
  CloudOffIcon,
  CreditCardIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { type IconSvgElement } from '@/components/custom/hugeicons-icon';
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

export function keyStatusText({
  status,
}: {
  status: AiProviderKeyStatus;
}): string | undefined {
  return badgeOf({ status })?.text;
}

function badgeOf({ status }: { status: AiProviderKeyStatus }): {
  icon: IconSvgElement;
  text: string;
  variant: 'success' | 'warning' | 'error' | 'secondary';
} | null {
  switch (status) {
    case 'active':
      return { icon: Tick02Icon, text: t('Active'), variant: 'success' };
    case 'out_of_credits':
      return {
        icon: CreditCardIcon,
        text: t('Out of credits'),
        variant: 'warning',
      };
    case 'rejected':
      return { icon: Cancel01Icon, text: t('Key rejected'), variant: 'error' };
    case 'unreachable':
      return {
        icon: CloudOffIcon,
        text: t('Unreachable'),
        variant: 'secondary',
      };
    default:
      return null;
  }
}
