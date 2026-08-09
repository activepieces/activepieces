import { isNil } from '@activepieces/core-utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { iterationRailUtils, RailDotStatus } from './iteration-rail-utils';

const IterationRail = ({
  total,
  current,
  statuses,
  onSelect,
  inputTooltip,
  itemLabel,
}: IterationRailProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevIndexRef = useRef(current);

  useEffect(() => {
    if (prevIndexRef.current !== current) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600);
      prevIndexRef.current = current;
      return () => clearTimeout(timer);
    }
  }, [current]);

  function onChange(value: string) {
    onSelect(iterationRailUtils.clampIndex({ value, total }));
  }

  return (
    <div className="absolute -top-4 -left-[45px]">
      <div className="flex items-center justify-center flex-col gap-0.5">
        <IterationRailButton
          onChange={onChange}
          isIncreasing={true}
          currentIndex={current}
        />
        <Tooltip>
          <TooltipTrigger>
            <Input
              className={cn(
                'py-2 w-[35px] px-0 h-[35px] animate-in fade-in bg-background border-solid rounded-md text-center !text-xs transition-all duration-300 ease-in-out',
                isAnimating
                  ? 'border-2 border-primary'
                  : 'border border-border',
              )}
              type="number"
              value={current + 1}
              min={1}
              max={total}
              onClick={(e) => {
                if (e.button === 0) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onChange={(e) => {
                const value =
                  isNil(e.target.value) ||
                  e.target.value.length === 0 ||
                  e.target.value === 'e'
                    ? '1'
                    : e.target.value;
                onChange(value);
              }}
            />
          </TooltipTrigger>
          <TooltipContent side="left">{inputTooltip}</TooltipContent>
        </Tooltip>
        <IterationRailButton
          onChange={onChange}
          isIncreasing={false}
          currentIndex={current}
        />
        {total > 1 && statuses.length > 0 && (
          <div className="mt-1 flex max-h-[120px] w-11 flex-wrap content-start justify-center gap-0.5 overflow-y-auto overflow-x-hidden p-1">
            {statuses.map((status, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={itemLabel(index)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelect(index);
                    }}
                    className={cn(
                      'size-2.5 shrink-0 rounded-full border border-background transition-transform hover:scale-125',
                      iterationRailUtils.dotClassName(status),
                      index === current && 'ring-1 ring-primary ring-offset-1',
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="left">
                  {`${itemLabel(index)} · ${iterationRailUtils.statusLabel(
                    status,
                  )}`}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

IterationRail.displayName = 'IterationRail';

const IterationRailButton = ({
  onChange,
  isIncreasing,
  currentIndex,
}: {
  onChange: (val: string) => void;
  isIncreasing: boolean;
  currentIndex: number;
}) => {
  return (
    <Button
      variant="ghost"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange((currentIndex + (isIncreasing ? 2 : 0)).toString());
      }}
      className="hover:bg-builder-background size-6"
      size="icon"
    >
      {isIncreasing ? (
        <ChevronUp className="w-2 h-2"></ChevronUp>
      ) : (
        <ChevronDown className="w-2 h-2"></ChevronDown>
      )}
    </Button>
  );
};

export { IterationRail };
export type IterationRailProps = {
  total: number;
  current: number;
  statuses: RailDotStatus[];
  onSelect: (index: number) => void;
  inputTooltip: string;
  itemLabel: (index: number) => string;
};
