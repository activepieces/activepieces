import { Info } from 'lucide-react';
import { Label as LabelPrimitive } from 'radix-ui';
import * as React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root> & {
  showRequiredIndicator?: boolean;
};

function RequiredFieldAsterisk() {
  return <span className="text-danger-11">*</span>;
}

function Label({
  className,
  showRequiredIndicator,
  children,
  ...props
}: LabelProps) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'flex items-center gap-1 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      {showRequiredIndicator && <RequiredFieldAsterisk />}
    </LabelPrimitive.Root>
  );
}

function LabelWithTooltip({
  label,
  tooltip,
}: {
  label: string;
  tooltip: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3.5 h-3.5 text-gray-11 cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export { Label, LabelWithTooltip, RequiredFieldAsterisk };
export type { LabelProps };
