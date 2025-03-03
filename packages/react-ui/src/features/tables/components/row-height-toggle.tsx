import { t } from 'i18next';
import { Rows2, Rows3, Rows4 } from 'lucide-react';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { RowHeight } from '../lib/types';


const ToggleTooltip = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
};
const RowHeightToggle = ({
  rowHeight,
  setRowHeight,
}: {
  rowHeight: RowHeight;
  setRowHeight: (rowHeight: RowHeight) => void;
}) => {
  return (
    <RadioGroup
      value={rowHeight}
      onValueChange={(value) => setRowHeight(value as RowHeight)}
      className="flex items-center gap-1 bg-muted p-1 rounded-md"
    >
      <div className="flex items-center">
        <ToggleTooltip label={t('Compact')}>
          <RadioGroupItem
            value={RowHeight.COMPACT}
            id={RowHeight.COMPACT}
            className="sr-only"
          />
          <label
            htmlFor={RowHeight.COMPACT}
            className={cn(
              'flex items-center justify-center p-2 rounded-sm cursor-pointer hover:bg-background transition-colors',
              rowHeight === RowHeight.COMPACT ? 'bg-background' : '',
            )}
          >
            <Rows4
              className={cn(
                'h-4 w-4',
                rowHeight === RowHeight.COMPACT
                  ? 'text-primary'
                  : 'text-muted-foreground',
              )}
            />
          </label>
        </ToggleTooltip>
      </div>
      <div className="flex items-center">
        <ToggleTooltip label={t('Default')}>
          <>
            <RadioGroupItem
              value={RowHeight.DEFAULT}
              id={RowHeight.DEFAULT}
              className="sr-only"
            />
            <label
              htmlFor={RowHeight.DEFAULT}
              className={cn(
                'flex items-center justify-center p-2 rounded-sm cursor-pointer hover:bg-background transition-colors',
                rowHeight === RowHeight.DEFAULT ? 'bg-background' : '',
              )}
            >
              <Rows3
                className={cn(
                  'h-4 w-4',
                  rowHeight === RowHeight.DEFAULT
                    ? 'text-primary'
                    : 'text-muted-foreground',
                )}
              />
            </label>
          </>
        </ToggleTooltip>
      </div>
      <div className="flex items-center">
        <ToggleTooltip label={t('Expanded')}>
          <RadioGroupItem
            value={RowHeight.EXPANDED}
            id={RowHeight.EXPANDED}
            className="sr-only"
          />
          <label
            htmlFor={RowHeight.EXPANDED}
            className={cn(
              'flex items-center justify-center p-2 rounded-sm cursor-pointer hover:bg-background transition-colors',
              rowHeight === RowHeight.EXPANDED ? 'bg-background' : '',
            )}
          >
            <Rows2
              className={cn(
                'h-4 w-4',
                rowHeight === RowHeight.EXPANDED
                  ? 'text-primary'
                  : 'text-muted-foreground',
              )}
            />
          </label>
        </ToggleTooltip>
      </div>
    </RadioGroup>
  );
};
RowHeightToggle.displayName = 'RowHeightToggle';

export default RowHeightToggle;
