'use client';

import { t } from 'i18next';
import * as React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Period, display12HourValue, setDateByType } from './time-picker-utils';

export interface PeriodSelectorProps {
  period: Period;
  setPeriod: (m: Period) => void;
  date: Date | undefined;
  setDate: (date: Date) => void;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
  isActive: boolean;
}

export const TimePeriodSelect = React.forwardRef<
  HTMLButtonElement,
  PeriodSelectorProps
>(
  (
    { period, setPeriod, date, setDate, onLeftFocus, onRightFocus, isActive },
    ref,
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'ArrowRight') onRightFocus?.();
      if (e.key === 'ArrowLeft') onLeftFocus?.();
    };
    const handleValueChange = (value: Period) => {
      setPeriod(value);

      /**
       * trigger an update whenever the user switches between AM and PM;
       * otherwise user must manually change the hour each time
       */
      if (date) {
        const tempDate = new Date(date);
        const hours = display12HourValue(date.getHours());
        setDate(
          setDateByType(
            tempDate,
            hours.toString(),
            '12hours',
            period === 'AM' ? 'PM' : 'AM',
          ),
        );
      }
    };
    return (
      <div className="flex h-10 items-center">
        <Select
          value={period}
          onValueChange={(value: Period) => handleValueChange(value)}
        >
          <SelectTrigger
            ref={ref}
            data-active={isActive}
            className="hover:bg-gray-4 dark:bg-transparent dark:hover:bg-gray-4 data-[active=true]:bg-gray-1 data-[active=true]:hover:bg-gray-4 w-14 h-[29px] focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-gray-8 focus-visible:ring-offset-1 rounded-xs justify-center p-0 transition-all border-none text-sm shadow-none gap-1"
            onKeyDown={handleKeyDown}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">{t('AM')}</SelectItem>
            <SelectItem value="PM">{t('PM')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  },
);

TimePeriodSelect.displayName = 'TimePeriodSelect';
