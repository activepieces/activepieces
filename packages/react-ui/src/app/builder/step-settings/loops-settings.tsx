import { t } from 'i18next';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { ApMarkdown } from '@/components/custom/markdown';
import { FormField, FormItem, FormLabel } from '@/components/ui/form';
import { LoopOnItemsAction } from '@activepieces/shared';

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
    <FormField
      control={form.control}
      name="settings.items"
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2">
          <ApMarkdown markdown={markdown} />
          <FormLabel>
            {t('Items')} <span className="text-destructive">*</span>
          </FormLabel>
          <TextInputWithMentions
            disabled={readonly}
            onChange={field.onChange}
            initialValue={field.value}
            placeholder={t('Select an array of items')}
          ></TextInputWithMentions>
        </FormItem>
      )}
    />
  );
});

LoopsSettings.displayName = 'LoopsSettings';
export { LoopsSettings };
