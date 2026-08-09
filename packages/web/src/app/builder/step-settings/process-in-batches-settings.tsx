import { ProcessInBatchesAction } from '@activepieces/shared';
import { t } from 'i18next';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { TextInputWithMentions } from '../piece-properties/text-input-with-mentions';

type ProcessInBatchesSettingsProps = {
  readonly: boolean;
};

const ProcessInBatchesSettings = React.memo(
  ({ readonly }: ProcessInBatchesSettingsProps) => {
    const form = useFormContext<ProcessInBatchesAction>();

    return (
      <>
        <FormField
          control={form.control}
          name="settings.items"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel showRequiredIndicator>{t('Items')}</FormLabel>
              <TextInputWithMentions
                disabled={readonly}
                onChange={field.onChange}
                initialValue={field.value}
                placeholder={t('Select an array of items')}
              ></TextInputWithMentions>
              <FormDescription>
                {t(
                  'Batches run in parallel. Completion order is not guaranteed.',
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="settings.batchSize"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel showRequiredIndicator>
                {t('Items per Batch')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  min={1}
                  step={1}
                  disabled={readonly}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ''
                        ? undefined
                        : e.target.valueAsNumber,
                    )
                  }
                />
              </FormControl>
              <FormDescription>
                {t(
                  'Smaller batches run wider, up to what your workers can run at once.',
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </>
    );
  },
);

ProcessInBatchesSettings.displayName = 'ProcessInBatchesSettings';
export { ProcessInBatchesSettings };
