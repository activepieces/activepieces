import React from 'react';
import { useFormContext } from 'react-hook-form';

import { ApMarkdown } from '@/components/custom/markdown';
import { FormField, FormItem, FormLabel } from '@/components/ui/form';
import { LoopOnItemsAction } from '@activepieces/shared';

import { TextInputWithMentions } from '../data-to-insert/text-input-with-mentions';

const markdown = `
Select the items to iterate over from the previous step by clicking on the **Items** input, which should be a **list** of items.

The loop will iterate over each item in the list and execute the next step for every item.
`;

const LoopsSettings = React.memo(() => {
  const form = useFormContext<LoopOnItemsAction>();

  return (
    <FormField
      control={form.control}
      name="settings.items"
      render={({ field }) => (
        <FormItem className='flex flex-col gap-2'>
          <ApMarkdown markdown={markdown} />
          <FormLabel htmlFor="email">Items</FormLabel>
          <TextInputWithMentions
            onChange={field.onChange}
            originalValue={field.value}
            placeholder="Select an array of items"
          ></TextInputWithMentions>
        </FormItem>
      )}
    />
  );
});

LoopsSettings.displayName = 'LoopsSettings';
export { LoopsSettings };
