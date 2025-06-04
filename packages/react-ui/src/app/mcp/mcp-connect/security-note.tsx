import { t } from 'i18next';
import { AlertTriangle } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const SecurityNote = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex cursor-default items-center gap-1 text-xs border border-warning/50 text-warning-300 dark:border-warning px-1.5 py-0.5 rounded-sm">
          <AlertTriangle className="h-3 w-3" />
          <span className="font-medium">{t('Security')}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-xs">
          {t(
            'This URL grants access to your tools and data. Only share with trusted applications.',
          )}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};
