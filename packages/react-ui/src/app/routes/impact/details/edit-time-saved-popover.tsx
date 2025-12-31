import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useContext, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { RefreshAnalyticsContext } from '@/features/platform-admin/lib/refresh-analytics-context';
import { FlowOperationType } from '@activepieces/shared';

type EditTimeSavedPopoverProps = {
  flowId: string;
  currentValue: number | null | undefined;
  children: React.ReactNode;
};

const getInitialValue = (currentValue: number | null | undefined): string => {
  if (currentValue === null || currentValue === undefined) {
    return '';
  }
  return currentValue.toString();
};

export function EditTimeSavedPopover({
  flowId,
  currentValue,
  children,
}: EditTimeSavedPopoverProps) {
  const { setTimeSavedPerRunOverride } = useContext(RefreshAnalyticsContext);
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState<string>(getInitialValue(currentValue));

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setValue(getInitialValue(currentValue));
    }
    setIsOpen(open);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (timeSavedPerRun: number | null) => {
      await flowsApi.update(flowId, {
        type: FlowOperationType.UPDATE_MINUTES_SAVED,
        request: {
          timeSavedPerRun,
        },
      });
    },
    onSuccess: () => {
      const newValue = value === '' ? null : parseInt(value, 10);
      setTimeSavedPerRunOverride(flowId, newValue);
      setIsOpen(false);
    },
    onError: () => {
      toast.error(t('Failed to update time saved'));
    },
  });

  const handleSave = () => {
    const newValue = value === '' ? null : parseInt(value, 10);
    if (value !== '' && (isNaN(newValue!) || newValue! < 0)) {
      toast.error(t('Please enter a valid number'));
      return;
    }
    mutate(newValue);
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
      <PopoverContent className="w-64 p-3" align="start">
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">{t('Time Saved Per Run')}</div>
          <div className="text-xs text-muted-foreground">
            {t(
              'Enter minutes saved per run, or leave empty to use automatic estimation',
            )}
          </div>
          <Input
            type="number"
            min={0}
            placeholder={t('e.g. 15')}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
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
