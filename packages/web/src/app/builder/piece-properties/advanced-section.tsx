import { t } from 'i18next';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-hook-form';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn, GAP_SIZE_FOR_STEP_SETTINGS } from '@/lib/utils';

function getNestedErrorPaths(
  errors: Record<string, unknown>,
  prefix: string,
): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(errors ?? {})) {
    const path = prefix.length > 0 ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && 'message' in value) {
      paths.push(path);
    } else if (value && typeof value === 'object') {
      paths.push(
        ...getNestedErrorPaths(value as Record<string, unknown>, path),
      );
    }
  }
  return paths;
}

function AdvancedSection({
  count,
  watchPaths,
  children,
}: AdvancedSectionProps) {
  const [open, setOpen] = useState(false);
  const autoOpenedRef = useRef(false);
  const { errors } = useFormState({ name: watchPaths });

  useEffect(() => {
    if (autoOpenedRef.current) return;
    const errorPaths = getNestedErrorPaths(
      errors as Record<string, unknown>,
      '',
    );
    const hasNestedError = watchPaths.some((watchPath) =>
      errorPaths.some((errorPath) => errorPath.startsWith(watchPath)),
    );
    if (hasNestedError) {
      autoOpenedRef.current = true;
      setOpen(true);
    }
  }, [errors, watchPaths]);

  if (count === 0) {
    return null;
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border-t border-border pt-4 mt-2"
    >
      <CollapsibleTrigger
        className={cn(
          'group flex items-center gap-2.5 w-full text-left',
          'rounded-md focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-primary/35 focus-visible:ring-offset-2',
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[13px] font-semibold tracking-[-0.005em] text-foreground">
          {t('Advanced')}
        </span>
        <span className="ml-auto text-[11.5px] text-muted-foreground tabular-nums">
          {open
            ? t('Hide')
            : t('{count, plural, =1 {1 option} other {# options}}', { count })}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200',
            !open && '-rotate-90',
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'overflow-hidden',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          'data-[state=open]:slide-in-from-top-1 data-[state=closed]:slide-out-to-top-1',
        )}
      >
        <div className={cn('pt-3.5 flex flex-col', GAP_SIZE_FOR_STEP_SETTINGS)}>
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

AdvancedSection.displayName = 'AdvancedSection';
export { AdvancedSection };

type AdvancedSectionProps = {
  count: number;
  watchPaths: string[];
  children: React.ReactNode;
};
