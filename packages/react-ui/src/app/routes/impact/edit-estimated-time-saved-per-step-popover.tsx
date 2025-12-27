import { t } from 'i18next';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { platformAnalyticsHooks } from '@/features/platform-admin/lib/analytics-hooks';
import {
  DEFAULT_ESTIMATED_TIME_SAVED_PER_STEP,
  isNil,
} from '@activepieces/shared';

type EditEstimatedTimeSavedPerStepPopoverProps = {
  currentValue?: number | null;
  children: React.ReactNode;
};

export function EditEstimatedTimeSavedPerStepPopover({
  currentValue,
  children,
}: EditEstimatedTimeSavedPerStepPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const initialValue = useMemo(() => {
    const value = isNil(currentValue)
      ? DEFAULT_ESTIMATED_TIME_SAVED_PER_STEP
      : currentValue;
    return value.toString();
  }, [currentValue]);

  const [value, setValue] = useState<string>(initialValue);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setValue(initialValue);
    }
    setIsOpen(open);
  };

  const { mutate, isPending } =
    platformAnalyticsHooks.useUpdatePlatformReport();

  const handleSave = () => {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) {
      toast.error(t('Please enter a valid number'));
      return;
    }

    mutate(
      { estimatedTimeSavedPerStep: parsed, outdated: true },
      {
        onSuccess: () => {
          setIsOpen(false);
        },
        onError: () => {
          toast.error(t('Failed to update estimation'));
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">{t('Estimation')}</div>
          <div className="text-xs text-muted-foreground">
            {t(
              'Use this as the default minutes saved per step when a flow doesn’t have its own per-run estimate.',
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              step={0.5}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {t('min/step')}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              {t('Cancel')}
            </Button>
            <Button size="sm" onClick={handleSave} loading={isPending}>
              {t('Save')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
