import { t } from 'i18next';
import { Goal } from 'lucide-react';

const TriggerWidget = () => {
  return (
    <div className="flex items-center absolute -top-[27px] -left-[1px] border-border border border-b-transparent  justify-center gap-1 rounded-t-lg bg-secondary text-muted-foreground text-xs p-1 ">
      <Goal className="w-[10px] h-[10px]"></Goal> {t('Trigger')}
    </div>
  );
};

export { TriggerWidget };

