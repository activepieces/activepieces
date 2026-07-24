import { LoopBatchMode, LoopOnItemsAction } from '@activepieces/shared';
import { t } from 'i18next';
import { Info } from 'lucide-react';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { ApMarkdown } from '@/components/custom/markdown';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn, GAP_SIZE_FOR_STEP_SETTINGS } from '@/lib/utils';

import { TextInputWithMentions } from '../piece-properties/text-input-with-mentions';

const markdown = t(
  'Select the items to iterate over from the previous step by clicking on the **Items** input, which should be a **list** of items.\n\nThe loop will iterate over each item in the list and execute the next step for every item.',
);

type LoopsSettingsProps = {
  readonly: boolean;
};

const LoopsSettings = React.memo(({ readonly }: LoopsSettingsProps) => {
  const form = useFormContext<LoopOnItemsAction>();
  const batching = form.watch('settings.batching');

  return (
    <div className={cn('flex flex-col', GAP_SIZE_FOR_STEP_SETTINGS)}>
      <FormField
        control={form.control}
        name="settings.items"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2">
            <ApMarkdown markdown={markdown} />
            <FormLabel showRequiredIndicator>{t('Items')}</FormLabel>
            <TextInputWithMentions
              disabled={readonly}
              onChange={field.onChange}
              initialValue={field.value}
              placeholder={t('Select an array of items')}
            ></TextInputWithMentions>
          </FormItem>
        )}
      />

      <Separator />

      <FormItem>
        <FormLabel
          htmlFor="loopBatching"
          className="flex items-center gap-1 h-7.5 max-h-7.5"
        >
          <FormControl>
            <Switch
              id="loopBatching"
              disabled={readonly}
              checked={!!batching}
              onCheckedChange={(checked) =>
                form.setValue(
                  'settings.batching',
                  checked
                    ? { mode: LoopBatchMode.ITEMS_PER_BATCH, size: 10 }
                    : undefined,
                  { shouldValidate: true, shouldDirty: true },
                )
              }
            />
          </FormControl>
          <span className="ml-2">{t('Batch items')}</span>
        </FormLabel>
      </FormItem>

      {batching && (
        <>
          <FormField
            control={form.control}
            name="settings.batching.mode"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel>{t('Batch by')}</FormLabel>
                <Select
                  disabled={readonly}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LoopBatchMode.ITEMS_PER_BATCH}>
                      {t('Items per batch')}
                    </SelectItem>
                    <SelectItem value={LoopBatchMode.NUMBER_OF_BATCHES}>
                      {t('Number of batches')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="settings.batching.size"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel showRequiredIndicator>
                  {batching.mode === LoopBatchMode.ITEMS_PER_BATCH
                    ? t('Items per batch')
                    : t('Number of batches')}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    disabled={readonly}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = e.target.valueAsNumber;
                      field.onChange(Number.isNaN(value) ? undefined : value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Alert variant="primary">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t(
                'Each iteration now passes a batch (an array of items) instead of a single item. Steps after this loop must accept an array of records.',
              )}
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
});

LoopsSettings.displayName = 'LoopsSettings';
export { LoopsSettings };
