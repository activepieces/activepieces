import { t } from 'i18next';
import { X } from 'lucide-react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type ClosePanelButtonProps = {
  disabled?: boolean;
  className?: string;
};

const ClosePanelButton = ({
  disabled = false,
  className,
}: ClosePanelButtonProps) => {
  const setStepDataPanelOpen = useBuilderStateContext(
    (state) => state.setStepDataPanelOpen,
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setStepDataPanelOpen(false)}
          disabled={disabled}
          aria-label={t('Close')}
          className={cn('size-8 shrink-0 text-muted-foreground', className)}
        >
          <X className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{t('Close')}</TooltipContent>
    </Tooltip>
  );
};

ClosePanelButton.displayName = 'ClosePanelButton';
export { ClosePanelButton };
