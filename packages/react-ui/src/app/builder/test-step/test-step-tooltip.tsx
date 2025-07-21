import { t } from 'i18next';
import { useContext } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

type TestButtonTooltipProps = {
  children: React.ReactNode;
  invalid: boolean;
};

const TestButtonTooltip = ({ children, invalid }: TestButtonTooltipProps) => {
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild className="disabled:pointer-events-auto">
          {children}
        </TooltipTrigger>
        {invalid && (
          <TooltipContent side="bottom">
            {t('Please fix inputs first')}
          </TooltipContent>
        )}
        {isLoadingDynamicProperties && (
          <TooltipContent side="bottom">
            {t('Please wait until all inputs are loaded')}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

TestButtonTooltip.displayName = 'TestButtonTooltip';
export { TestButtonTooltip };
