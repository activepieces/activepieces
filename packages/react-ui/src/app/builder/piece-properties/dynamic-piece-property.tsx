import deepEqual from 'deep-equal';
import React, { useState, useRef, useContext } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useDeepCompareEffectNoCheck } from 'use-deep-compare-effect';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { SkeletonList } from '@/components/ui/skeleton';
import { formUtils } from '@/features/pieces/lib/form-utils';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework';
import { Action, Trigger } from '@activepieces/shared';

import { useStepSettingsContext } from '../step-settings/step-settings-context';

import { AutoPropertiesFormComponent } from './auto-properties-form';
import { DynamicPropertiesErrorBoundary } from './dynamic-piece-properties-error-boundary';
import { DynamicPropertiesContext } from './dynamic-properties-context';
type DynamicPropertiesProps = {
  refreshers: string[];
  propertyName: string;
  disabled: boolean;
};

const DynamicPropertiesImplementation = React.memo(
  (props: DynamicPropertiesProps) => {
    const [flowVersion, readonly] = useBuilderStateContext((state) => [
      state.flowVersion,
      state.readonly,
    ]);
    const form = useFormContext<Action | Trigger>();
    const { updateFormSchema } = useStepSettingsContext();
    const isFirstRender = useRef(true);
    const previousValues = useRef<undefined | unknown[]>(undefined);
    const { propertyLoadingFinished, propertyLoadingStarted } = useContext(
      DynamicPropertiesContext,
    );
    const [propertyMap, setPropertyMap] = useState<
      PiecePropertyMap | undefined
    >(undefined);
    const newRefreshers = [...props.refreshers, 'auth'];

    const { mutate, isPending, error } =
      piecesHooks.usePieceOptions<PropertyType.DYNAMIC>({
        onMutate: () => {
          propertyLoadingStarted(props.propertyName);
        },
        onError: (error) => {
          console.error(error);
          propertyLoadingFinished(props.propertyName);
        },
        onSuccess: () => {
          propertyLoadingFinished(props.propertyName);
        },
      });
    if (error) {
      throw error;
    }
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
      const { settings } = form.getValues();
      const actionOrTriggerName = settings.actionName ?? settings.triggerName;
      const { pieceName, pieceVersion, pieceType, packageType } = settings;
      mutate(
        {
          request: {
            pieceName,
            pieceVersion,
            pieceType,
            packageType,
            propertyName: props.propertyName,
            actionOrTriggerName: actionOrTriggerName,
            input,
            flowVersionId: flowVersion.id,
            flowId: flowVersion.flowId,
          },
          propertyType: PropertyType.DYNAMIC,
        },
        {
          onSuccess: (response) => {
            const currentValue = form.getValues(
              `settings.input.${props.propertyName}`,
            );
            const customizedInput = form.getValues(
              'settings.inputUiInfo.customizedInputs',
            );
            const defaultValue = formUtils.getDefaultValueForStep(
              response.options,
              currentValue ?? {},
              customizedInput,
            );
            setPropertyMap(response.options);

            updateFormSchema(
              `settings.input.${props.propertyName}`,
              response.options,
            );

            if (!readonly) {
              const schemaInput: Record<string, unknown> =
                form.getValues()?.settings?.inputUiInfo?.schema ?? {};
              form.setValue(`settings.inputUiInfo.schema`, {
                ...schemaInput,
                [props.propertyName]: response.options,
              } as Record<string, unknown>);
            }

            form.setValue(
              `settings.input.${props.propertyName}`,
              defaultValue,
              {
                shouldValidate: true,
                shouldDirty: true,
              },
            );
          },
        },
      );
    }, refresherValues);

    return (
      <>
        {isPending && (
          <SkeletonList numberOfItems={3} className="h-7"></SkeletonList>
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
  },
);

const DynamicProperties = React.memo((props: DynamicPropertiesProps) => {
  return (
    <DynamicPropertiesErrorBoundary>
      <DynamicPropertiesImplementation {...props} />
    </DynamicPropertiesErrorBoundary>
  );
});
DynamicPropertiesImplementation.displayName = 'DynamicPropertiesImplementation';
DynamicProperties.displayName = 'DynamicProperties';
export { DynamicProperties };
