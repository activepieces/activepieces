import { Clock, ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

export const DomainStatusIcon = ({ status }: { status: DomainStatus }) => (
  <div
    data-status={status}
    className={cn(
      'flex size-9 items-center justify-center rounded-lg [&_svg]:size-4',
      STATUS_STYLES[status],
    )}
  >
    {status === 'pending' ? <Clock /> : <ShieldCheck />}
  </div>
);

const STATUS_STYLES: Record<DomainStatus, string> = {
  none: 'border bg-panel text-gray-9 opacity-60',
  pending: 'bg-warning-3 text-warning-11',
  verified: 'bg-success-3 text-success-11',
};

export type DomainStatus = 'none' | 'pending' | 'verified';
