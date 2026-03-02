import { t } from 'i18next';
import { Goal } from 'lucide-react';

import { cn } from '@/lib/utils';

const TriggerWidget = ({ isSelected }: { isSelected: boolean }) => {
  return (
    <div
      className={cn(
        'flex items-center absolute transition-all  -translate-y-[26px] -translate-x-[1px]  border-border border border-1   justify-center gap-1 rounded-t-md bg-background text-muted-foreground text-xs py-1 px-2 ',
        {
          'border-primary text-primary ': isSelected,
          'group-hover:border-ring ': !isSelected,
        },
      )}
    >
      <Goal className="w-[10px] h-[10px]"></Goal> {t('Trigger')}
    </div>
  );
};

export { TriggerWidget };
