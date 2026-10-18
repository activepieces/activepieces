import { Gem } from 'lucide-react';

import { cn } from '@/lib/utils';

export function LockedGem({ className }: LockedGemProps) {
  return <Gem aria-hidden className={cn('size-3.5 shrink-0', className)} />;
}

type LockedGemProps = {
  className?: string;
};
