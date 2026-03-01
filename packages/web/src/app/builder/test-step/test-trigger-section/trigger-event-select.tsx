import { TriggerEventWithPayload } from '@activepieces/shared';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useBuilderStateContext } from '../../builder-hooks';
import { useStepSettingsContext } from '../../step-settings/step-settings-context';

type TriggerEventSelectProps = {
  pollResults: { data: TriggerEventWithPayload[] } | undefined;
  sampleData: unknown;
};

export const TriggerEventSelect = React.memo(
  ({ pollResults, sampleData }: TriggerEventSelectProps) => {
    const selectedId = getSelectedId(sampleData, pollResults?.data ?? []);

    const { stepName } = useStepSettingsContext();

    const updateSampleData = useBuilderStateContext(
      (state) => state.updateSampleData,
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
                stepName,
                output: triggerEvent.payload,
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
