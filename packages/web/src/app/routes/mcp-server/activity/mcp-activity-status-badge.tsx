import { McpActivityStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, X } from 'lucide-react';

import { StatusBadge } from '@/components/custom/status-badge';

export function McpActivityStatusBadge({
  status,
}: {
  status: McpActivityStatus;
}) {
  return status === McpActivityStatus.enum.SUCCEEDED ? (
    <StatusBadge status={status} icon={Check} text={t('Succeeded')} />
  ) : (
    <StatusBadge status={status} icon={X} text={t('Failed')} />
  );
}
