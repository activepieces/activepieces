import { Label as LabelPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root> & {
  showRequiredIndicator?: boolean;
};

function RequiredFieldAsterisk() {
  return <span className="text-destructive">*</span>;
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

export { Label, RequiredFieldAsterisk };
export type { LabelProps };
