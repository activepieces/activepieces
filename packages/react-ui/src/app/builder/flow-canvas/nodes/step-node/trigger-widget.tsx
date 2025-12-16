import { cn } from '@/lib/utils';
import { t } from 'i18next';
import { Goal } from 'lucide-react';

const TriggerWidget = ({isSelected,}: {isSelected: boolean}) => {
  return (
    <div className={cn("flex items-center absolute transition-all group-hover:border-primary group-hover:text-primary group-hover:border-b-transparent -top-[27px] -left-[1px] border-border border border-b-transparent  justify-center gap-1 rounded-t-md bg-background text-muted-foreground text-xs py-1 px-2 ",{
      "border-primary text-primary border-b-transparent": isSelected,
    })}>
      <Goal className="w-[10px] h-[10px]"></Goal> {t('Trigger')}
    </div>
  );
};

export { TriggerWidget };

