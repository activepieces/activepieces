import { t } from 'i18next';
import { Goal } from 'lucide-react';

const TriggerWidget = () => {
  return (
    <div className="flex items-center absolute -top-[27px] -left-[1px] border-border border border-b-transparent  justify-center gap-1 rounded-t-md bg-background text-muted-foreground text-xs py-1 px-2 ">
      <Goal className="w-[10px] h-[10px]"></Goal> {t('Trigger')}
    </div>
  );
};

export { TriggerWidget };

