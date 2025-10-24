import dayjs from 'dayjs';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FlowTrigger, TriggerEventWithPayload } from '@activepieces/shared';

import { testStepHooks } from '../test-step-hooks';

type TriggerEventSelectProps = {
  pollResults: { data: TriggerEventWithPayload[] } | undefined;
  sampleData: unknown;
};

export const TriggerEventSelect = React.memo(
  ({ pollResults, sampleData }: TriggerEventSelectProps) => {
    const selectedId = getSelectedId(sampleData, pollResults?.data ?? []);

    const form = useFormContext<Pick<FlowTrigger, 'name' | 'settings'>>();
    const formValues = form.getValues();

    const { mutate: updateSampleData } = testStepHooks.useUpdateSampleData(
      formValues.name,
      (step) => {
        const sampleDataFileId = step.settings.sampleData?.sampleDataFileId;
        const sampleDataInputFileId =
          step.settings.sampleData?.sampleDataInputFileId;

        form.setValue(
          'settings.sampleData',
          {
            ...(formValues.settings.sampleData ?? {}),
            sampleDataFileId,
            sampleDataInputFileId,
            lastTestDate: dayjs().toISOString(),
          },
          { shouldValidate: true },
        );
      },
    );

    return (
      <div className="mb-3">
        <Select
          value={selectedId}
          onValueChange={(value: string) => {
            const triggerEvent = pollResults?.data.find(
              (triggerEvent) => triggerEvent.id === value,
            );
            if (triggerEvent) {
              updateSampleData({
                response: {
                  output: triggerEvent.payload,
                  success: true,
                },
              });
            }
          }}
        >
          <SelectTrigger
            className="w-full"
            disabled={pollResults && pollResults.data.length === 0}
          >
            {pollResults && pollResults.data.length > 0 ? (
              <SelectValue
                placeholder={t('No sample data available')}
              ></SelectValue>
            ) : (
              t('Old results were removed, retest for new sample data')
            )}
          </SelectTrigger>
          <SelectContent>
            {pollResults &&
              pollResults.data.map((triggerEvent, index) => (
                <SelectItem key={triggerEvent.id} value={triggerEvent.id}>
                  {t('Result #') + (index + 1)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <span className="text-sm mt-2 text-muted-foreground">
          {t('The sample data can be used in the next steps.')}
        </span>
      </div>
    );
  },
);

TriggerEventSelect.displayName = 'TriggerEventSelect';

function getSelectedId(
  sampleData: unknown,
  pollResults: TriggerEventWithPayload[],
) {
  if (sampleData === undefined) {
    return undefined;
  }
  return pollResults.find((result) => deepEqual(sampleData, result.payload))
    ?.id;
}
