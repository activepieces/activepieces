import { FlowRunStatus } from '@activepieces/shared';

import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { statusColors } from '@/lib/status-colors';
import { cn } from '@/lib/utils';

export function FlowRunStatusIcon({
  status,
  className,
}: FlowRunStatusIconProps) {
  const Icon = flowRunUtils.getStatusIcon(status);
  return <Icon className={cn(statusColors.of(status).text, className)} />;
}

type FlowRunStatusIconProps = {
  status: FlowRunStatus;
  className?: string;
};
