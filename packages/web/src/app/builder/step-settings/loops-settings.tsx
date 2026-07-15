import { LoopOnItemsAction } from '@activepieces/shared';
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

import { TextInputWithMentions } from '../piece-properties/text-input-with-mentions';

const markdown = t(
  'Select the items to iterate over from the previous step by clicking on the **Items** input, which should be a **list** of items.\n\nThe loop will iterate over each item in the list and execute the next step for every item.',
);

type LoopsSettingsProps = {
  readonly: boolean;
};

const LoopsSettings = React.memo(({ readonly }: LoopsSettingsProps) => {
  const form = useFormContext<LoopOnItemsAction>();

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
        name="settings.batchSize"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2">
            <FormLabel>{t('Batch Size')}</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                step={1}
                disabled={readonly}
                placeholder="1"
                value={field.value ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  field.onChange(raw === '' ? undefined : Number(raw));
                }}
              />
            </FormControl>
            <FormDescription>
              {t(
                'Optional. When set to more than 1, each iteration receives a list of that many items instead of a single item.',
              )}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});

LoopsSettings.displayName = 'LoopsSettings';
export { LoopsSettings };
