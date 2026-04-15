import { FlowOperationType } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useContext, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { flowsApi } from '@/features/flows';
import {
  analyticsApi,
  RefreshAnalyticsContext,
} from '@/features/platform-admin';

import { hmsToSeconds, secondsToHMS } from '../lib/impact-utils';

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
  const previousValueRef = useRef<number | null | undefined>(currentValue);
  const [isOpen, setIsOpen] = useState(false);

  const [hms, setHms] = useState({ hours: '', mins: '', secs: '' });
  const minsRef = useRef<HTMLInputElement>(null);
  const secsRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setHms(secondsToHMS(currentValue));
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
    onSuccess: () => {
      const isEdit =
        previousValueRef.current !== null &&
        previousValueRef.current !== undefined &&
        previousValueRef.current > 0;
      toast.success(
        isEdit
          ? t('Time saved updated successfully')
          : t('Time saved added successfully'),
      );
    },
    onError: () => {
      setTimeSavedPerRunOverride(flowId, previousValueRef.current ?? null);
      toast.error(t('Failed to update time saved'));
    },
  });

  const handleSave = () => {
    mutate(hmsToSeconds(hms.hours, hms.mins, hms.secs));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') setIsOpen(false);
  };

  const handleTimeInput = (
    value: string,
    field: keyof typeof hms,
    max: number,
    nextRef: React.RefObject<HTMLInputElement | null> | null,
  ) => {
    const numericValue = value.replace(/\D/g, '');

    if (field === 'hours') {
      const num = parseInt(numericValue, 10);
      if (numericValue === '' || (num >= 0 && num <= max)) {
        setHms((prev) => ({ ...prev, hours: numericValue }));
      }
      return;
    }

    if (numericValue === '') {
      setHms((prev) => ({ ...prev, [field]: '' }));
      return;
    }

    if (numericValue.length === 1) {
      const digit = parseInt(numericValue, 10);
      if (digit >= 6) {
        setHms((prev) => ({ ...prev, [field]: '0' + numericValue }));
        nextRef?.current?.focus();
        nextRef?.current?.select();
        return;
      }
      setHms((prev) => ({ ...prev, [field]: numericValue }));
      return;
    }

    const clamped = numericValue.slice(0, 2);
    const num = parseInt(clamped, 10);
    if (num >= 0 && num <= max) {
      setHms((prev) => ({ ...prev, [field]: clamped }));
      nextRef?.current?.focus();
      nextRef?.current?.select();
    }
  };

  const padOnBlur = (field: 'mins' | 'secs') => {
    setHms((prev) => {
      const val = prev[field];
      if (val.length === 1) {
        return { ...prev, [field]: '0' + val };
      }
      return prev;
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[260px] p-4" align="start">
        <div className="flex flex-col gap-4">
          <div className="text-sm font-semibold">{t('Time Saved Per Run')}</div>

          <div className="flex items-center rounded-md border border-input bg-background px-3 py-1.5 gap-1 focus-within:ring-1 focus-within:ring-ring">
            <div className="flex flex-col items-center gap-0.5 flex-1">
              <input
                type="text"
                inputMode="numeric"
                placeholder="hh"
                value={hms.hours}
                onChange={(e) =>
                  handleTimeInput(e.target.value, 'hours', 1000, minsRef)
                }
                onKeyDown={handleKeyDown}
                className="w-full text-center text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
                maxLength={4}
                autoFocus
              />
            </div>
            <span className="text-muted-foreground font-medium">:</span>
            <div className="flex flex-col items-center gap-0.5 flex-1">
              <input
                ref={minsRef}
                type="text"
                inputMode="numeric"
                placeholder="mm"
                value={hms.mins}
                onChange={(e) =>
                  handleTimeInput(e.target.value, 'mins', 59, secsRef)
                }
                onBlur={() => padOnBlur('mins')}
                onKeyDown={handleKeyDown}
                className="w-full text-center text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
                maxLength={2}
              />
            </div>
            <span className="text-muted-foreground font-medium">:</span>
            <div className="flex flex-col items-center gap-0.5 flex-1">
              <input
                ref={secsRef}
                type="text"
                inputMode="numeric"
                placeholder="ss"
                value={hms.secs}
                onChange={(e) =>
                  handleTimeInput(e.target.value, 'secs', 59, null)
                }
                onBlur={() => padOnBlur('secs')}
                onKeyDown={handleKeyDown}
                className="w-full text-center text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
                maxLength={2}
              />
            </div>
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
