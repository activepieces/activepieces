'use client';

import * as React from 'react';

import { TimePeriodSelect } from './time-period-select';
import { TimePickerInput } from './time-picker-input';
import { Period } from './time-picker-utils';
import { isNil } from '../../../../shared/src';
import { cn } from '@/lib/utils';

interface TimePickerDemoProps {
  date: Date | undefined;
  setDate: (date: Date) => void;
  showSeconds?: boolean;
}


const minutesItems = new Array(60).fill(0).map((_, index) => ({
  value: (index).toString(),
  label: index < 10 ? `0${index}` : (index).toString(),
}));

const hoursItems = new Array(12).fill(0).map((_, index) => ({
  value: (index+1).toString(),
  label: index+1 < 10 ? `0${index+1}` :   (index+1).toString(),
}));

export function ClockPicker({ date, setDate, showSeconds }: TimePickerDemoProps) {
  const [period, setPeriod] = React.useState<Period>(() => {
    if (date) {
      return date.getHours() >= 12 ? 'PM' : 'AM';
    }
    return 'AM';
  });
  const isActive = !isNil(date);
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const hourRef = React.useRef<HTMLInputElement>(null);
  const secondRef = React.useRef<HTMLInputElement>(null);
  const periodRef = React.useRef<HTMLButtonElement>(null);

  return (
    <div className={cn("flex items-center transition-all  gap-2 w-full text-muted-foreground justify-center bg-accent/50 py-1 px-2 rounded-sm h-[43px] border border-solid border-border",{
      'text-foreground': isActive
    })}>
      <div className="grid gap-1 text-center">
        <TimePickerInput
          picker="12hours"
          isActive={isActive}
          period={period}
          date={date}
          setDate={setDate}
          ref={hourRef}
          onRightFocus={() => minuteRef.current?.focus()}
          autoCompleteList={hoursItems}
          />
      </div>
      :
      <div className="grid gap-1 text-center">
        <TimePickerInput
          picker="minutes"
          id="minutes12"
          isActive={isActive}
          date={date}
          setDate={setDate}
          ref={minuteRef}
          onLeftFocus={() => hourRef.current?.focus()}
          onRightFocus={() => secondRef.current?.focus()}
          autoCompleteList={minutesItems}
        />
      </div>
     {
      showSeconds && ( <>
      :
      <div className="grid gap-1 text-center">
        <TimePickerInput
          picker="seconds"
          id="seconds12"
          isActive={isActive}
          date={date}
          setDate={setDate}
          ref={secondRef}
          onLeftFocus={() => minuteRef.current?.focus()}
          onRightFocus={() => periodRef.current?.focus()}
        />        
      </div></>)
     }
      <div className="grid gap-1 text-center">
        <TimePeriodSelect
          period={period}
          isActive={isActive}
          setPeriod={setPeriod}
          date={date}
          setDate={setDate}
          ref={periodRef}
          onLeftFocus={() => secondRef.current?.focus()}
        />
      </div>
    </div>
  );
}
