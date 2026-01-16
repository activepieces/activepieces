import { t } from 'i18next';
import { Loader } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ThinkingProps {
  className?: string;
}

export function Thinking({ className }: ThinkingProps) {
  return (
    <div
      className={cn(
        'group text-base max-w-[70%] space-y-4 flex items-start gap-2',
        className,
      )}
    >
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-2">
          <Loader className="size-4 animate-spin" />
          <span className="text-muted-foreground">{t('Thinking...')}</span>
        </div>
      </div>
    </div>
  );
}
