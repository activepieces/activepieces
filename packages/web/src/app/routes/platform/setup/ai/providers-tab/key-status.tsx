import { isNil } from '@activepieces/core-utils';
import { AiProviderKeyStatus } from '@activepieces/shared';
import { t } from 'i18next';

import { Badge } from '@/components/ui/badge';

export function KeyStatusBadge({ status }: { status: AiProviderKeyStatus }) {
  const badge = badgeOf({ status });
  if (isNil(badge)) {
    return null;
  }
  return (
    <Badge
      variant={badge.variant}
      className="gap-1.5 rounded-full border-transparent px-2"
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {badge.text}
    </Badge>
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
  text: string;
  variant: 'success' | 'warning' | 'destructive' | 'secondary';
} | null {
  switch (status) {
    case 'active':
      return { text: t('Active'), variant: 'success' };
    case 'out_of_credits':
      return { text: t('Out of credits'), variant: 'warning' };
    case 'rejected':
      return { text: t('Key rejected'), variant: 'destructive' };
    case 'unreachable':
      return { text: t('Unreachable'), variant: 'secondary' };
    default:
      return null;
  }
}
