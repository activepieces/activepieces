import { isNil } from '@activepieces/core-utils';
import {
  FlowActionType,
  flowStructureUtil,
  FlowVersion,
  LoopOnItemsAction,
} from '@activepieces/shared';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { ApMarkdown } from '@/components/custom/markdown';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField, FormItem, FormLabel } from '@/components/ui/form';

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
  if (isInsideBatch({ flowVersion, selectedStep })) {
    return null;
  }

  return (
    <Alert variant="warning">
      <TriangleAlert />
      <AlertDescription>
        {t(
          'This flow could run a lot faster. Your last test returned {count, number} items, and a loop handles them one by one. Process in Batches runs several at once.',
          { count: itemsCount },
        )}
      </AlertDescription>
    </Alert>
  );
};

const isInsideBatch = ({
  flowVersion,
  selectedStep,
}: {
  flowVersion: FlowVersion;
  selectedStep: string | null;
}): boolean =>
  !isNil(selectedStep) &&
  flowStructureUtil
    .getAllSteps(flowVersion.trigger)
    .some(
      (step) =>
        step.type === FlowActionType.PROCESS_IN_BATCHES &&
        flowStructureUtil.isChildOf(step, selectedStep),
    );

const LARGE_LIST_THRESHOLD = 1000;
