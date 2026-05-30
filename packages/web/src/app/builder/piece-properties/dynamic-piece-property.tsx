import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework';
import {
  AUTHENTICATION_PROPERTY_NAME,
  isNil,
  PropertySettings,
} from '@activepieces/shared';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { RefreshCcw } from 'lucide-react';
import React, { useState, useRef, useContext } from 'react';
import { useFormContext, UseFormReturn, useWatch } from 'react-hook-form';
import { useDeepCompareEffectNoCheck } from 'use-deep-compare-effect';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import { SkeletonList } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { piecesHooks, formUtils } from '@/features/pieces';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { DynamicPropertiesErrorBoundary } from './dynamic-piece-properties-error-boundary';
import { DynamicPropertiesContext } from './dynamic-properties-context';
import { GenericPropertiesForm } from './generic-properties-form';
import { dynamicPropsCache } from './piece-options-cache';

const removeOptionsFromDropdownPropertiesSchema = (
  schema: PiecePropertyMap,
): PiecePropertyMap => {
  return Object.fromEntries(
    Object.entries(schema).map(([key, value]) => {
      if (
        value.type === PropertyType.STATIC_DROPDOWN ||
        value.type === PropertyType.STATIC_MULTI_SELECT_DROPDOWN
      ) {
        return [key, { ...value, options: { disabled: false, options: [] } }];
      }
      return [key, value];
    }),
  ) as PiecePropertyMap;
};

const DynamicPropertiesImplementation = React.memo(
  (props: DynamicPropertiesProps) => {
    const [flowVersion, readonly] = useBuilderStateContext((state) => [
      state.flowVersion,
      state.readonly,
    ]);
    const form = useFormContext();
    const watchConfig: Record<string, unknown> = {
      name:
        props.placedInside === 'stepSettings' ? 'settings.input' : undefined,
    };
    const allInputsValues = useWatch(watchConfig);
    const refreshersPropertiesNames = [
      ...props.refreshers,
      AUTHENTICATION_PROPERTY_NAME,
    ];
    const refresherValues = refreshersPropertiesNames.reduce<
      Record<string, unknown>
    >((acc, refresher) => {
      acc[refresher] = allInputsValues[refresher];
      return acc;
    }, {});
    const previousRefresherValues =
      useRef<Record<string, unknown>>(refresherValues);
    const { propertyLoadingFinished, propertyLoadingStarted } = useContext(
      DynamicPropertiesContext,
    );
    const [propertyMap, setPropertyMap] = useState<
      PiecePropertyMap | undefined
    >(undefined);
    const propertyPrefix =
      props.placedInside === 'stepSettings' ? 'settings.input' : '';
    const { mutate, isPending } =
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

    const clearPropertyValue = () => {
      // the field state won't be cleared if you only unset the parent prop value
      if (propertyMap) {
        Object.keys(propertyMap).forEach((childPropName) => {
          form.setValue(
            prependPrefixToPropertyName({
              propertyName: `${props.propertyName}.${childPropName}`,
              prefix: propertyPrefix,
            }),
            null,
            {
              //never validate for each prop, it can be a long list of props and cause the browser to freeze
              shouldValidate: false,
            },
          );
        });
      }
      form.setValue(
        prependPrefixToPropertyName({
          propertyName: props.propertyName,
          prefix: propertyPrefix,
        }),
        null,
        {
          shouldValidate: true,
        },
      );
    };
    const applyResponse = (options: PiecePropertyMap) => {
      const propertyNameWithPrefix = prependPrefixToPropertyName({
        propertyName: props.propertyName,
        prefix: propertyPrefix,
      });
      const currentValue = form.getValues(propertyNameWithPrefix);
      const defaultValue = formUtils.getDefaultValueForProperties({
        props: options,
        existingInput: currentValue ?? {},
        propertySettings: props.propertySettings ?? {},
      });
      setPropertyMap(options);
      const schemaWithoutDropdownOptions =
        removeOptionsFromDropdownPropertiesSchema(options);
      props.updateFormSchema?.(
        propertyNameWithPrefix,
        schemaWithoutDropdownOptions,
      );

      if (!readonly && props.updatePropertySettingsSchema) {
        props.updatePropertySettingsSchema(
          schemaWithoutDropdownOptions,
          props.propertyName,
          form,
        );
      }
      form.setValue(propertyNameWithPrefix, defaultValue, {
        shouldValidate: true,
        shouldDirty: true,
      });
    };

    const fetchProperties = (options?: { force?: boolean }) => {
      const projectId = authenticationSession.getProjectId()!;
      const cacheKey = {
        projectId,
        pieceName: props.pieceName,
        pieceVersion: props.pieceVersion,
        propertyName: props.propertyName,
        actionOrTriggerName: props.actionOrTriggerName,
        input: refresherValues,
      };
      if (!options?.force) {
        const cached = dynamicPropsCache.get(cacheKey);
        if (cached) {
          applyResponse(cached);
          return;
        }
      }
      mutate(
        {
          request: {
            projectId,
            pieceName: props.pieceName,
            pieceVersion: props.pieceVersion,
            propertyName: props.propertyName,
            actionOrTriggerName: props.actionOrTriggerName,
            input: refresherValues,
            flowVersionId: flowVersion.id,
            flowId: flowVersion.flowId,
          },
          propertyType: PropertyType.DYNAMIC,
        },
        {
          onSuccess: (response) => {
            dynamicPropsCache.set(cacheKey, response.options);
            applyResponse(response.options);
          },
        },
      );
    };

    useDeepCompareEffectNoCheck(() => {
      if (!deepEqual(previousRefresherValues.current, refresherValues)) {
        clearPropertyValue();
      }
      previousRefresherValues.current = refresherValues;
      fetchProperties();
    }, [refresherValues]);

    const shouldShowSkeleton = isPending && !propertyMap;
    const shouldShowProperties = !!propertyMap;
    const showRefresh = !readonly && shouldShowProperties;

    if (!shouldShowSkeleton && !shouldShowProperties) {
      return null;
    }

    return (
      <div
        className={cn('rounded-md border border-border bg-background p-3', {
          'space-y-3': shouldShowSkeleton || shouldShowProperties,
        })}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {t('Fields')}
          </span>
          {showRefresh && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  type="button"
                  disabled={props.disabled || isPending}
                  onClick={() => fetchProperties({ force: true })}
                >
                  <RefreshCcw
                    className={cn('size-3', {
                      'animate-spin': isPending,
                    })}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('Refresh')}</TooltipContent>
            </Tooltip>
          )}
        </div>
        {shouldShowSkeleton && (
          <SkeletonList numberOfItems={3} className="h-7"></SkeletonList>
        )}
        {shouldShowProperties && (
          <GenericPropertiesForm
            prefixValue={prependPrefixToPropertyName({
              propertyName: props.propertyName,
              prefix: propertyPrefix,
            })}
            props={propertyMap}
            useMentionTextInput={!isNil(props.propertySettings)}
            disabled={props.disabled}
            propertySettings={props.propertySettings}
            dynamicPropsInfo={null}
            onValueChange={() => {
              form.trigger();
            }}
          ></GenericPropertiesForm>
        )}
      </div>
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

const prependPrefixToPropertyName = ({
  propertyName,
  prefix,
}: {
  propertyName: string;
  prefix: string;
}) => {
  return prefix.length === 0 ? propertyName : `${prefix}.${propertyName}`;
};

type DynamicPropertiesProps = {
  refreshers: string[];
  propertyName: string;
  pieceName: string;
  pieceVersion: string;
  actionOrTriggerName: string;
  disabled: boolean;
  placedInside: 'stepSettings' | 'predefinedAgentInputs';
  updateFormSchema:
    | ((key: string, newFieldSchema: PiecePropertyMap) => void)
    | null;
  propertySettings: Record<string, PropertySettings> | null;
  updatePropertySettingsSchema:
    | ((
        schema: PiecePropertyMap,
        propertyName: string,
        form: UseFormReturn,
      ) => void)
    | null;
};
