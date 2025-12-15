import { t } from 'i18next';
import { ChevronDown, Goal, RouteOff } from 'lucide-react';

import { InvalidStepIcon } from '@/components/custom/alert-icon';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { flowUtilConsts } from '../../utils/consts';

const StepNodeName = ({ stepName }: { stepName: string }) => {
  return (
    <div
      className="absolute left-full bg-builder-background ml-3 text-accent-foreground text-xs opacity-0 transition-all duration-300 group-hover:opacity-100 "
      style={{
        top: `${flowUtilConsts.AP_NODE_SIZE.STEP.height / 2 - 12}px`,
      }}
    >
      {stepName}
    </div>
  );
};

const StepNodeChevron = () => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="p-1 size-7 "
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (e.target) {
          const rightClickEvent = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 2,
            clientX: e.clientX,
            clientY: e.clientY,
          });
          e.target.dispatchEvent(rightClickEvent);
        }
      }}
    >
      <ChevronDown className="w-4 h-4 stroke-muted-foreground" />
    </Button>
  );
};

const StepNodeLogo = ({
  isSkipped,
  logoUrl,
  displayName,
}: {
  isSkipped: boolean;
  logoUrl: string;
  displayName: string;
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center p-1.5 border-border border border-solid rounded-xl',
        {
          'opacity-80': isSkipped,
        },
      )}
    >
      <ImageWithFallback
        src={logoUrl}
        alt={displayName}
        key={logoUrl + displayName}
        className="w-[25px] h-[25px]"
      />
    </div>
  );
};

const StepNodeDisplayName = ({
  stepDisplayName,
  stepIndex,
  isSkipped,
  pieceDisplayName,
}: {
  stepDisplayName: string;
  stepIndex: number;
  isSkipped: boolean;
  pieceDisplayName: string;
}) => {
  return (
    <div className="grow flex flex-col items-start justify-center min-w-0 w-full">
      <div className=" flex items-center justify-between min-w-0 w-full">
        <TextWithTooltip
          tooltipMessage={stepDisplayName.length > 19 ? stepDisplayName : ''}
        >
          <div
            className={cn('text-sm truncate font-semibold grow shrink ', {
              'text-accent-foreground/70': isSkipped,
            })}
          >
            {stepIndex}. {stepDisplayName}
          </div>
        </TextWithTooltip>
      </div>
      <div className="flex justify-between w-full items-center">
        <div className="text-xs truncate text-muted-foreground text-ellipsis overflow-hidden whitespace-nowrap w-full">
          {pieceDisplayName}
        </div>
      </div>
    </div>
  );
};

const Triggerwidget = () => {
  return (
    <div className="flex items-center absolute -top-[27px] -left-[1px] border-border border border-b-transparent  justify-center gap-1 rounded-t-lg bg-secondary text-muted-foreground text-xs p-1 ">
      <Goal className="w-[10px] h-[10px]"></Goal> {t('Trigger')}
    </div>
  );
};

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
      style={{ height: `${flowUtilConsts.AP_NODE_SIZE.STEP.height}px` }}
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
export {
  StepNodeName,
  StepInvalidOrSkippedIcon,
  StepNodeChevron,
  StepNodeLogo,
  StepNodeDisplayName,
  Triggerwidget,
};
