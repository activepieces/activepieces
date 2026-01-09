import { t } from 'i18next';
import { RouteOff } from 'lucide-react';

import { InvalidStepIcon } from '@/components/custom/alert-icon';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { flowCanvasConsts } from '../../utils/consts';

const StepInvalidOrSkippedIcon = ({
  isValid,
  isSkipped,
}: {
  isValid: boolean;
  isSkipped: boolean;
}) => {
  return (
    <div
      className="absolute flex items-center -left-[22px] bg-builder-background "
      style={{ height: `${flowCanvasConsts.AP_NODE_SIZE.STEP.height}px` }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            {!isValid && !isSkipped && (
              <InvalidStepIcon className="h-4 w-4"></InvalidStepIcon>
            )}
            {isSkipped && (
              <RouteOff className="w-3.5 h-3.5 animate-fade text-muted-foreground"></RouteOff>
            )}
          </div>
        </TooltipTrigger>
        {(!isValid || isSkipped) && (
          <TooltipContent>
            <div>
              {!isValid && !isSkipped && t('Incomplete step')}
              {isSkipped && t('Skipped')}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
};

export { StepInvalidOrSkippedIcon };
