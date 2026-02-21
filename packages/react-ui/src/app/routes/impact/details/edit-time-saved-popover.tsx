import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useContext, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { analyticsApi } from '@/features/platform-admin/lib/analytics-api';
import { RefreshAnalyticsContext } from '@/features/platform-admin/lib/refresh-analytics-context';
import { FlowOperationType } from '@activepieces/shared';

import { hmsToMinutes, minutesToHMS } from '../lib/impact-utils';

type EditTimeSavedPopoverProps = {
  flowId: string;
  currentValue: number | null | undefined;
  children: React.ReactNode;
};

export function EditTimeSavedPopover({
  flowId,
  currentValue,
  children,
}: EditTimeSavedPopoverProps) {
  const { setTimeSavedPerRunOverride } = useContext(RefreshAnalyticsContext);
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState('');
  const [mins, setMins] = useState('');
  const [secs, setSecs] = useState('');
  const previousValueRef = useRef<number | null | undefined>(currentValue);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      const hms = minutesToHMS(currentValue);
      setHours(hms.hours);
      setMins(hms.mins);
      setSecs(hms.secs);
      previousValueRef.current = currentValue;
    }
    setIsOpen(open);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (timeSavedPerRun: number | null) => {
      await flowsApi.update(flowId, {
        type: FlowOperationType.UPDATE_MINUTES_SAVED,
        request: { timeSavedPerRun },
      });
      await analyticsApi.markAsOutdated();
    },
    onMutate: async (timeSavedPerRun: number | null) => {
      setTimeSavedPerRunOverride(flowId, timeSavedPerRun);
      setIsOpen(false);
    },
    onError: () => {
      setTimeSavedPerRunOverride(flowId, previousValueRef.current ?? null);
      toast.error(t('Failed to update time saved'));
    },
  });

  const handleSave = () => {
    mutate(hmsToMinutes(hours, mins, secs));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') setIsOpen(false);
  };

  const handleInputChange = (
    value: string,
    setter: (val: string) => void,
    max: number,
  ) => {
    const numericValue = value.replace(/\D/g, '');
    const num = parseInt(numericValue, 10);
    if (numericValue === '' || (num >= 0 && num <= max)) {
      setter(numericValue);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[260px] p-4" align="start">
        <div className="flex flex-col gap-4">
          <div className="text-sm font-semibold">{t('Time Saved Per Run')}</div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="hh"
              value={hours}
              onChange={(e) => handleInputChange(e.target.value, setHours, 99)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-center h-9 bg-background"
              maxLength={2}
              autoFocus
            />
            <span className="text-muted-foreground font-medium shrink-0">
              :
            </span>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="mm"
              value={mins}
              onChange={(e) => handleInputChange(e.target.value, setMins, 59)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-center h-9 bg-background"
              maxLength={2}
            />
            <span className="text-muted-foreground font-medium shrink-0">
              :
            </span>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="ss"
              value={secs}
              onChange={(e) => handleInputChange(e.target.value, setSecs, 59)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-center h-9 bg-background"
              maxLength={2}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {t('How long this task takes without automation.')}
          </p>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
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
