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
  saving: boolean;
};

const TestButtonTooltip = ({
  children,
  invalid,
  saving,
}: TestButtonTooltipProps) => {
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild className="disabled:pointer-events-auto">
          {children}
        </TooltipTrigger>
        {(invalid || isLoadingDynamicProperties || saving) && (
          <TooltipContent side="bottom">
            {invalid
              ? t('Fill in the required fields first')
              : isLoadingDynamicProperties
              ? t('Please wait until all inputs are loaded')
              : t('Saving...')}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

TestButtonTooltip.displayName = 'TestButtonTooltip';
export { TestButtonTooltip };
