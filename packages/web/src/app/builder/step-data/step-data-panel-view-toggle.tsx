import { t } from 'i18next';
import { Columns2, Rows2 } from 'lucide-react';

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
  const ToggleIcon = isSplit ? Rows2 : Columns2;
  const toggleLabel = isSplit ? t('Collapse') : t('Split View');

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
