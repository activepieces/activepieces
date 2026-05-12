import {
  LOOP_DEFAULT_CONCURRENCY,
  LOOP_MAX_CONCURRENCY,
  LOOP_MIN_CONCURRENCY,
  LoopOnItemsAction,
} from '@activepieces/shared';
import { t } from 'i18next';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { ApMarkdown } from '@/components/custom/markdown';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { TextInputWithMentions } from '../piece-properties/text-input-with-mentions';

type LoopsSettingsProps = {
  readonly: boolean;
};

const LoopsSettings = React.memo(({ readonly }: LoopsSettingsProps) => {
  const form = useFormContext<LoopOnItemsAction>();
  const executeAsync = form.watch('settings.executeAsync') ?? false;

  return (
    <div className="flex flex-col gap-4">
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

      <FormField
        control={form.control}
        name="settings.executeAsync"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2">
              <Switch
                id="loop-execute-async"
                disabled={readonly}
                checked={field.value ?? false}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
              <Label htmlFor="loop-execute-async">
                {t('Run iterations in parallel')}
              </Label>
            </div>
            <FormDescription>
              {t(
                'Execute iterations concurrently instead of one after another. The loop stops at the first failed iteration.',
              )}
            </FormDescription>
          </FormItem>
        )}
      />

      {executeAsync && (
        <FormField
          control={form.control}
          name="settings.concurrency"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>{t('Max concurrent iterations')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={LOOP_MIN_CONCURRENCY}
                  max={LOOP_MAX_CONCURRENCY}
                  disabled={readonly}
                  value={field.value ?? LOOP_DEFAULT_CONCURRENCY}
                  onChange={(e) => {
                    const next = e.target.valueAsNumber;
                    field.onChange(Number.isFinite(next) ? next : undefined);
                  }}
                />
              </FormControl>
              <FormDescription>
                {t(
                  'How many iterations run at the same time. Default is {default}, maximum is {max}.',
                  {
                    default: LOOP_DEFAULT_CONCURRENCY,
                    max: LOOP_MAX_CONCURRENCY,
                  },
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
});

LoopsSettings.displayName = 'LoopsSettings';

const markdown = t(
  'Select the items to iterate over from the previous step by clicking on the **Items** input, which should be a **list** of items.\n\nThe loop will iterate over each item in the list and execute the next step for every item.',
);

export { LoopsSettings };
