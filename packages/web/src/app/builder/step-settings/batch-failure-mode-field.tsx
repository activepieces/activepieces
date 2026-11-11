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
import { cn } from '@/lib/utils';

const BatchFailureModeField = React.memo(
  ({ readonly }: BatchFailureModeFieldProps) => {
    const form = useFormContext<ProcessInBatchesAction>();
    const labelId = React.useId();

    return (
      <FormField
        control={form.control}
        name="settings.errorHandlingOptions.continueOnFailure.value"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2">
            <FormLabel id={labelId}>{t('If a batch fails')}</FormLabel>
            <FormControl>
              <RadioGroupPrimitive.Root
                aria-labelledby={labelId}
                disabled={readonly}
                value={field.value === true ? CONTINUE : STOP}
                onValueChange={(value) => field.onChange(value === CONTINUE)}
                className="flex h-9 gap-0.5 rounded-lg bg-gray-3 p-0.5"
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
                    'If any batch fails, the step fails once every batch has finished or the wait times out.',
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

const segmentClass = cn(
  'flex grow items-center justify-center rounded-md text-sm font-medium text-gray-11 outline-none transition-all',
  'hover:text-gray-12 focus-visible:ring-2 focus-visible:ring-gray-8',
  'data-[state=checked]:bg-panel data-[state=checked]:font-semibold data-[state=checked]:text-gray-12 data-[state=checked]:shadow-xs',
  'disabled:pointer-events-none disabled:opacity-50',
);

BatchFailureModeField.displayName = 'BatchFailureModeField';
export { BatchFailureModeField };

type BatchFailureModeFieldProps = {
  readonly: boolean;
};
