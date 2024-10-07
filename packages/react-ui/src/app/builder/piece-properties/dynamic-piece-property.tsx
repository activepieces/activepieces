import { useMutation } from '@tanstack/react-query';
import deepEqual from 'deep-equal';
import React, { useState, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useDeepCompareEffectNoCheck } from 'use-deep-compare-effect';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { formUtils } from '@/app/builder/piece-properties/form-utils';
import { SkeletonList } from '@/components/ui/skeleton';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { PiecePropertyMap } from '@activepieces/pieces-framework';
import { Action, Trigger } from '@activepieces/shared';

import { useStepSettingsContext } from '../step-settings/step-settings-context';

import { AutoPropertiesFormComponent } from './auto-properties-form';

type DynamicPropertiesProps = {
  refreshers: string[];
  propertyName: string;
  disabled: boolean;
};
const DynamicProperties = React.memo((props: DynamicPropertiesProps) => {
  const [flowVersion] = useBuilderStateContext((state) => [state.flowVersion]);
  const form = useFormContext<Action | Trigger>();
  const { updateFormSchema } = useStepSettingsContext();
  const isFirstRender = useRef(true);
  const previousValues = useRef<undefined | unknown[]>(undefined);

  const [propertyMap, setPropertyMap] = useState<PiecePropertyMap | undefined>(
    undefined,
  );
  const newRefreshers = [...props.refreshers, 'auth'];

  const { mutate, isPending } = useMutation<
    PiecePropertyMap,
    Error,
    { input: Record<string, unknown> }
  >({
    mutationFn: async ({ input }) => {
      const { settings } = form.getValues();
      const actionOrTriggerName = settings.actionName ?? settings.triggerName;
      const { pieceName, pieceVersion, pieceType, packageType } = settings;
      return piecesApi.options<PiecePropertyMap>({
        pieceName,
        pieceVersion,
        pieceType,
        packageType,
        propertyName: props.propertyName,
        actionOrTriggerName,
        input,
        flowVersionId: flowVersion.id,
        flowId: flowVersion.flowId,
      });
    },
    onError: (error) => {
      console.error(error);
    },
  });

  /* eslint-disable react-hooks/rules-of-hooks */
  const refresherValues = newRefreshers.map((refresher) =>
    useWatch({
      name: `settings.input.${refresher}` as const,
      control: form.control,
    }),
  );
  /* eslint-enable react-hooks/rules-of-hooks */

  useDeepCompareEffectNoCheck(() => {
    const input: Record<string, unknown> = {};
    newRefreshers.forEach((refresher, index) => {
      input[refresher] = refresherValues[index];
    });

    if (
      !isFirstRender.current &&
      !deepEqual(previousValues.current, refresherValues)
    ) {
      // the field state won't be cleared if you only unset the parent prop value
      if (propertyMap) {
        Object.keys(propertyMap).forEach((childPropName) => {
          form.setValue(
            `settings.input.${props.propertyName}.${childPropName}` as const,
            null,
            {
              shouldValidate: true,
            },
          );
        });
      }
      form.setValue(`settings.input.${props.propertyName}` as const, null, {
        shouldValidate: true,
      });
    }

    previousValues.current = refresherValues;
    isFirstRender.current = false;

    mutate(
      { input },
      {
        onSuccess: (response) => {
          const currentValue = form.getValues(
            `settings.input.${props.propertyName}`,
          );
          const defaultValue = formUtils.getDefaultValueForStep(
            response,
            currentValue ?? {},
          );
          setPropertyMap(response);
          updateFormSchema(`settings.input.${props.propertyName}`, response);

          form.setValue(`settings.input.${props.propertyName}`, defaultValue, {
            shouldValidate: true,
            shouldDirty: true,
          });
        },
      },
    );
  }, refresherValues);

  return (
    <>
      {isPending && (
        <div className="space-y-3">
          <SkeletonList numberOfItems={3} className="h-7"></SkeletonList>
        </div>
      )}
      {!isPending && propertyMap && (
        <AutoPropertiesFormComponent
          prefixValue={`settings.input.${props.propertyName}`}
          props={propertyMap}
          useMentionTextInput={true}
          disabled={props.disabled}
          allowDynamicValues={true}
        ></AutoPropertiesFormComponent>
      )}
    </>
  );
});

DynamicProperties.displayName = 'DynamicProperties';
export { DynamicProperties };
