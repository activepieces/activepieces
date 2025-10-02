import deepEqual from 'deep-equal';
import React, { useState, useRef, useContext } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useDeepCompareEffectNoCheck } from 'use-deep-compare-effect';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { SkeletonList } from '@/components/ui/skeleton';
import { formUtils } from '@/features/pieces/lib/form-utils';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { PiecePropertyMap, PropertyType, StaticDropdownProperty, StaticMultiSelectDropdownProperty } from '@activepieces/pieces-framework';
import { FlowAction, FlowTrigger } from '@activepieces/shared';

import { useStepSettingsContext } from '../step-settings/step-settings-context';

import { AutoPropertiesFormComponent } from './auto-properties-form';
import { DynamicPropertiesErrorBoundary } from './dynamic-piece-properties-error-boundary';
import { DynamicPropertiesContext } from './dynamic-properties-context';
type DynamicPropertiesProps = {
  refreshers: string[];
  propertyName: string;
  disabled: boolean;
};

const removeOptionsFromDropdownPropertiesSchema = (schema: PiecePropertyMap) => {
  return Object.fromEntries(Object.entries(schema).map(([key, value]) => {
    if(value.type === PropertyType.STATIC_DROPDOWN || value.type === PropertyType.STATIC_MULTI_SELECT_DROPDOWN) {
      return [key, { ...value, options: { disabled: false, options: [] } }];
    }
    return [key, value];
  }));
}

const DynamicPropertiesImplementation = React.memo(
  (props: DynamicPropertiesProps) => {
    const [flowVersion, readonly] = useBuilderStateContext((state) => [
      state.flowVersion,
      state.readonly,
    ]);
    const form = useFormContext<FlowAction | FlowTrigger>();
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
                  //never validate for each prop, it can be a long list of props and cause the browser to freeze
                  shouldValidate: false,
                },
              );
            })
        }
        form.setValue(`settings.input.${props.propertyName}` as const, null, {
          shouldValidate: true,
        });
      }

      previousValues.current = refresherValues;
      isFirstRender.current = false;
      const { settings } = form.getValues();
      const actionOrTriggerName = settings.actionName ?? settings.triggerName;
      const { pieceName, pieceVersion } = settings;
      mutate(
        {
          request: {
            pieceName,
            pieceVersion,
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
            const defaultValue = formUtils.getDefaultValueForStep({
              props: response.options,
              existingInput: currentValue ?? {},
              propertySettings:
                form.getValues().settings?.propertySettings?.[
                  props.propertyName
                ],
            });
            setPropertyMap(response.options);
            const schemaWithoutDropdownOptions = removeOptionsFromDropdownPropertiesSchema(response.options);
            updateFormSchema(
              `settings.input.${props.propertyName}`,
              schemaWithoutDropdownOptions,
            );

            if (!readonly) {
              form.setValue(
                `settings.propertySettings.${props.propertyName}.schema`,
                schemaWithoutDropdownOptions,
              );
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
