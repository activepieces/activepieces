import { ProcessInBatchesAction } from '@activepieces/shared';
import { t } from 'i18next';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';

type BatchFailureModeFieldProps = {
  readonly: boolean;
};

const BatchFailureModeField = React.memo(
  ({ readonly }: BatchFailureModeFieldProps) => {
    const form = useFormContext<ProcessInBatchesAction>();

    return (
      <FormField
        control={form.control}
        name="settings.errorHandlingOptions.continueOnFailure.value"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2">
            <FormLabel>{t('If a batch fails')}</FormLabel>
            <FormControl>
              <RadioGroupPrimitive.Root
                disabled={readonly}
                value={field.value === true ? CONTINUE : STOP}
                onValueChange={(value) => field.onChange(value === CONTINUE)}
                className="flex gap-0.75 rounded-lg border bg-muted p-0.75"
              >
                <RadioGroupPrimitive.Item value={STOP} className={segmentClass}>
                  {t('Stop the step')}
                </RadioGroupPrimitive.Item>
                <RadioGroupPrimitive.Item
                  value={CONTINUE}
                  className={segmentClass}
                >
                  {t('Continue & report')}
                </RadioGroupPrimitive.Item>
              </RadioGroupPrimitive.Root>
            </FormControl>
            <FormDescription>
              {field.value === true
                ? t(
                    'The step succeeds anyway and reports which batches failed in its output.',
                  )
                : t(
                    'The step fails as soon as one batch fails, like any other step.',
                  )}
            </FormDescription>
          </FormItem>
        )}
      />
    );
  },
);

const STOP = 'stop';
const CONTINUE = 'continue';

const segmentClass = [
  'flex h-8 grow items-center justify-center rounded-md border border-transparent',
  'text-[13px] font-medium text-muted-foreground outline-none transition-colors',
  'hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
  'data-[state=checked]:border-border data-[state=checked]:bg-background data-[state=checked]:font-semibold data-[state=checked]:text-foreground data-[state=checked]:shadow-xs',
  'disabled:pointer-events-none disabled:opacity-50',
].join(' ');

BatchFailureModeField.displayName = 'BatchFailureModeField';
export { BatchFailureModeField };
