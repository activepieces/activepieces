import { ErrorCode } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

import { api } from '@/lib/api';

import { FlowLink } from './components/project-grouped-flow-list';

export function ModelArrowDisplay({
  prefixIcon,
  from,
  to,
}: {
  prefixIcon?: ReactNode;
  from: string;
  to: string;
}) {
  return (
    <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-hidden whitespace-nowrap text-sm">
      {prefixIcon}
      <span className="min-w-0 truncate">{from}</span>
      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
      <span className="min-w-0 truncate">{to}</span>
    </div>
  );
}

export function MigrationFlowRow({
  icon,
  projectId,
  flowId,
  displayName,
  children,
}: {
  icon: ReactNode;
  projectId: string;
  flowId: string;
  displayName: string;
  children: ReactNode;
}) {
  return (
    <li key={flowId} className="flex items-start gap-3 rounded-md border p-3">
      {icon}
      <div className="flex flex-col gap-1 min-w-0">
        <FlowLink
          projectId={projectId}
          flowId={flowId}
          displayName={displayName}
        />
        {children}
      </div>
    </li>
  );
}

export function resolveMigrateFlowsErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (api.isApError(error, ErrorCode.MIGRATE_FLOW_MODEL_JOB_ALREADY_EXISTS)) {
    return t('A migration is already running. Try again after it completes.');
  }
  return fallback;
}
