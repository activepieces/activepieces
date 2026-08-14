import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { useMemo, useRef, useState } from 'react';

import { TimePicker } from '@/components/custom/time-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { formatUtils } from '@/lib/format-utils';

import { useCellContext } from './cell-context';
import { CellEditorTrigger } from './cell-editor-trigger';

function DatetimeEditor() {
  const { value, handleCellChange, setIsEditing, isEditing } = useCellContext();
  const [pendingDate, setPendingDate] = useState<Date | undefined>(undefined);
  const discardedRef = useRef(false);
  const committedDate = useMemo(() => parseDatetime(value), [value]);
  const date = pendingDate ?? committedDate;

  const handleClear = () => {
    setPendingDate(undefined);
    handleCellChange('');
  };

  const handleDaySelect = (day: Date | undefined) => {
    if (isNil(day)) {
      handleClear();
      return;
    }
    setPendingDate(isNil(date) ? day : applyTimeToDay({ time: date, day }));
  };

  const handleClose = () => {
    const stagedDate = pendingDate;
    setPendingDate(undefined);
    if (discardedRef.current || isNil(stagedDate)) {
      discardedRef.current = false;
      setIsEditing(false);
      return;
    }
    handleCellChange(stagedDate.toISOString());
  };

  return (
    <div className="h-full w-full">
      <Popover
        open={isEditing}
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
      >
        <CellEditorTrigger isEditing={isEditing}>
          <div className="flex grow h-full min-w-0 items-center">
            {isNil(date) ? '' : formatUtils.formatDateTime(date)}
          </div>
        </CellEditorTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          onEscapeKeyDown={() => {
            discardedRef.current = true;
          }}
        >
          <Calendar
            className="[--cell-size:--spacing(10)]"
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={handleDaySelect}
          />
          <div className="flex items-center justify-between gap-2 border-t border-border p-3">
            <TimePicker date={date} setDate={setPendingDate} />
            <Button
              variant="ghost"
              size="sm"
              disabled={isNil(date)}
              onClick={handleClear}
            >
              {t('Clear')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function parseDatetime(value: string) {
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

function applyTimeToDay({ time, day }: { time: Date; day: Date }) {
  const merged = new Date(day);
  merged.setHours(
    time.getHours(),
    time.getMinutes(),
    time.getSeconds(),
    time.getMilliseconds(),
  );
  return merged;
}

export { DatetimeEditor };
