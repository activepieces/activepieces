import { isNil } from '@activepieces/core-utils';
import { LoopOnItemsAction } from '@activepieces/shared';
import { t } from 'i18next';
import { Lightbulb } from 'lucide-react';
import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { ApMarkdown } from '@/components/custom/markdown';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField, FormItem, FormLabel } from '@/components/ui/form';
import { pieceSelectorUtils } from '@/features/pieces';

import { TextInputWithMentions } from '../piece-properties/text-input-with-mentions';

import { processInBatchesUtils } from './process-in-batches-utils';

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
          <FormLabel showRequiredIndicator>{t('Items')}</FormLabel>
          <TextInputWithMentions
            disabled={readonly}
            onChange={field.onChange}
            initialValue={field.value}
            placeholder={t('Select an array of items')}
          ></TextInputWithMentions>
          <LargeListWarning />
        </FormItem>
      )}
    />
  );
});

LoopsSettings.displayName = 'LoopsSettings';
export { LoopsSettings };

const LargeListWarning = () => {
  const form = useFormContext<LoopOnItemsAction>();
  const items = useWatch({ control: form.control, name: 'settings.items' });
  const outputSampleData = useBuilderStateContext(
    (state) => state.outputSampleData,
  );
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);
  const selectedStep = useBuilderStateContext((state) => state.selectedStep);

  const itemsCount = processInBatchesUtils.resolveItemsCount({
    items,
    outputSampleData,
  });
  if (isNil(itemsCount) || itemsCount < LARGE_LIST_THRESHOLD) {
    return null;
  }
  if (
    !isNil(selectedStep) &&
    pieceSelectorUtils.isStepInsideBatch({
      flowVersion,
      stepName: selectedStep,
    })
  ) {
    return null;
  }

  return (
    <Alert variant="primary">
      <Lightbulb />
      <AlertDescription>
        {t(
          "This flow could run a lot faster. Your last test returned {count, number} items, and a loop handles them one by one. To run several at once, add a Process in Batches step above this loop and give it this loop's list. Then move this loop inside it and set the loop's Items to the batch's items.",
          { count: itemsCount },
        )}
      </AlertDescription>
    </Alert>
  );
};

const LARGE_LIST_THRESHOLD = 1000;
