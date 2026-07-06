import { t } from 'i18next';
import { PanelBottom, PanelRight } from 'lucide-react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type StepDataPanelViewToggleProps = {
  disabled?: boolean;
  className?: string;
};

const StepDataPanelViewToggle = ({
  disabled = false,
  className,
}: StepDataPanelViewToggleProps) => {
  const [stepDataPanelView, setStepDataPanelView] = useBuilderStateContext(
    (state) => [state.stepDataPanelView, state.setStepDataPanelView],
  );

  const isSplit = stepDataPanelView === 'split';
  const ToggleIcon = isSplit ? PanelBottom : PanelRight;
  const toggleLabel = isSplit ? t('Bottom Panel') : t('Side by Side');

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setStepDataPanelView(isSplit ? 'drawer' : 'split')}
      disabled={disabled}
      className={cn('text-sm shrink-0', className)}
      aria-label={toggleLabel}
    >
      <ToggleIcon className="size-4" />
      <span>{toggleLabel}</span>
    </Button>
  );
};

StepDataPanelViewToggle.displayName = 'StepDataPanelViewToggle';
export { StepDataPanelViewToggle };
