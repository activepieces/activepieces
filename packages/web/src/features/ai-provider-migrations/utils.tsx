import { AgentProviderModelSchema, ErrorCode } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { api } from '@/lib/api';

import { FlowLink } from './components/project-grouped-flow-list';

export function ModelArrowDisplay({
  prefixIcon,
  from,
  to,
}: {
  prefixIcon?: ReactNode;
  from: AgentProviderModelSchema;
  to: AgentProviderModelSchema;
}) {
  return (
    <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-hidden whitespace-nowrap text-sm">
      {prefixIcon}
      <ProviderModelChip providerModel={from} />
      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
      <ProviderModelChip providerModel={to} />
    </div>
  );
}

function ProviderModelChip({
  providerModel,
}: {
  providerModel: AgentProviderModelSchema;
}) {
  const logoUrl = SUPPORTED_AI_PROVIDERS.find(
    (p) => p.provider === providerModel.provider,
  )?.logoUrl;
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="size-4 shrink-0 rounded-sm object-contain"
        />
      )}
      <span className="min-w-0 truncate">{providerModel.model}</span>
    </span>
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
