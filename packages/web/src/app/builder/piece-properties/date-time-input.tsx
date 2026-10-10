import { isNil } from '@activepieces/core-utils';
import { format } from 'date-fns';
import { t } from 'i18next';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { TimePicker } from '@/components/custom/time-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { FormFieldMentionInput } from './text-input-with-mentions';

export function DateTimeInput({
  value,
  onChange,
  placeholder,
  disabled,
}: DateTimeInputProps) {
  const [editorKey, setEditorKey] = useState(0);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const selectedDate = parseSelectedDate(value);

  const commitDate = (nextDate: Date) => {
    onChange(format(nextDate, LOCAL_ISO_FORMAT));
    setEditorKey((previousKey) => previousKey + 1);
  };

  const handleDaySelect = (day: Date | undefined) => {
    if (isNil(day)) {
      return;
    }
    const timeSource = selectedDate ?? new Date();
    const nextDate = new Date(day);
    nextDate.setHours(
      timeSource.getHours(),
      timeSource.getMinutes(),
      selectedDate?.getSeconds() ?? 0,
      0,
    );
    commitDate(nextDate);
  };

  return (
    <div className="relative [&_[role=textbox]]:pr-9">
      <FormFieldMentionInput
        key={editorKey}
        initialValue={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                aria-label={t('Pick a date and time')}
                className="absolute right-1 top-1 h-7 w-7 text-foreground/55 hover:text-foreground"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t('Pick a date and time')}
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-auto p-2" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            defaultMonth={selectedDate}
          />
          <div className="flex justify-center border-t pt-2">
            <TimePicker
              date={selectedDate}
              setDate={commitDate}
              showSeconds={false}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function parseSelectedDate(value: unknown): Date | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  if (value.trim().length === 0 || value.includes('{{')) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

const LOCAL_ISO_FORMAT = "yyyy-MM-dd'T'HH:mm:ssXXX";

type DateTimeInputProps = {
  value: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};
