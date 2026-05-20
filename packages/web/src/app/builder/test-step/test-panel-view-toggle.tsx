import { t } from 'i18next';
import { Columns2, Rows2 } from 'lucide-react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TestPanelViewToggleProps = {
  disabled?: boolean;
  className?: string;
};

const TestPanelViewToggle = ({
  disabled = false,
  className,
}: TestPanelViewToggleProps) => {
  const [testPanelView, setTestPanelView] = useBuilderStateContext((state) => [
    state.testPanelView,
    state.setTestPanelView,
  ]);

  const isSplit = testPanelView === 'split';
  const ToggleIcon = isSplit ? Rows2 : Columns2;
  const toggleLabel = isSplit ? t('Collapse') : t('Split View');

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setTestPanelView(isSplit ? 'drawer' : 'split')}
      disabled={disabled}
      className={cn(
        'text-sm text-muted-foreground hover:text-foreground shrink-0',
        className,
      )}
      aria-label={toggleLabel}
    >
      <ToggleIcon className="size-4" />
      <span>{toggleLabel}</span>
    </Button>
  );
};

TestPanelViewToggle.displayName = 'TestPanelViewToggle';
export { TestPanelViewToggle };
