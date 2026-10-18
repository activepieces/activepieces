import { TriangleAlert } from 'lucide-react';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const DialogCallout = ({
  tone,
  children,
}: {
  tone: 'danger' | 'warning';
  children: ReactNode;
}) => (
  <span
    className={cn(
      'flex items-start gap-2 rounded-lg border p-3 font-medium',
      TONE_STYLES[tone],
    )}
  >
    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
    <span>{children}</span>
  </span>
);

const TONE_STYLES = {
  danger: 'border-danger-7 bg-danger-3 text-danger-11',
  warning: 'border-warning-7 bg-warning-3 text-warning-11',
};
