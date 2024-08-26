import { t } from 'i18next';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type TestButtonTooltipProps = {
  children: React.ReactNode;
  disabled: boolean;
};

const TestButtonTooltip = ({ children, disabled }: TestButtonTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild className="disabled:pointer-events-auto">
          {children}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {disabled ? t('Please fix inputs first') : ''}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

TestButtonTooltip.displayName = 'TestButtonTooltip';
export { TestButtonTooltip };
