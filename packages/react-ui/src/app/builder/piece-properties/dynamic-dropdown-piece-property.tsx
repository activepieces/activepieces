import deepEqual from 'deep-equal';
import { t } from 'i18next';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { DropdownState, PieceProperty, PropertyType } from '@activepieces/pieces-framework';
import { FlowAction, isNil, FlowTrigger } from '@activepieces/shared';

import { MultiSelectPieceProperty } from '../../../components/custom/multi-select-piece-property';

import { DynamicPropertiesErrorBoundary } from './dynamic-piece-properties-error-boundary';
import { DynamicPropertiesContext } from './dynamic-properties-context';
import { AutoDynamicFields } from './auto-dynamic-fields';
import { Separator } from '@/components/ui/separator';

type SelectPiecePropertyProps = {
  refreshers: string[];
  propertyName: string;
  value?: unknown;
  multiple?: boolean;
  disabled: boolean;
  onChange: (value: unknown | undefined) => void;
  showDeselect?: boolean;
  shouldRefreshOnSearch?: boolean;
  allowDynamicValues: boolean;
  inputName: string;
  property: PieceProperty;
};
const DynamicDropdownPiecePropertyImplementation = React.memo(
  (props: SelectPiecePropertyProps) => {
    const [flowVersion, readonly] = useBuilderStateContext((state) => [
      state.flowVersion,
      state.readonly,
    ]);
    const form = useFormContext<FlowAction | FlowTrigger>();
    const isFirstRender = useRef(true);
    const previousValues = useRef<undefined | unknown[]>(undefined);
    const firstDropdownState = useRef<DropdownState<unknown> | undefined>(
      undefined,
    );
    const newRefreshers = [...props.refreshers, 'auth'];
    const [dropdownState, setDropdownState] = useState<DropdownState<unknown>>({
      disabled: false,
      placeholder: t('Select an option asc'),
      options: [],
    });
    const { propertyLoadingFinished, propertyLoadingStarted } = useContext(
      DynamicPropertiesContext,
    );
    const { mutate, isPending, error } = piecesHooks.usePieceOptions<
      PropertyType.DROPDOWN | PropertyType.MULTI_SELECT_DROPDOWN
    >({
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
    const refresh = (term?: string) => {
      const input: Record<string, unknown> = {};
      newRefreshers.forEach((refresher, index) => {
        input[refresher] = refresherValues[index];
      });
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
            searchValue: term,
          },
          propertyType: PropertyType.DROPDOWN,
        },
        {
          onSuccess: (response) => {
            if (!firstDropdownState.current) {
              firstDropdownState.current = response.options;
            }
            setDropdownState(response.options);
          },
        },
      );
    };

    useEffect(() => {
      if (
        !isFirstRender.current &&
        !deepEqual(previousValues.current, refresherValues)
      ) {
        props.onChange(null);
      }

      previousValues.current = refresherValues;
      isFirstRender.current = false;
      refresh();
    }, refresherValues);

    const selectOptions = dropdownState.options.map((option) => ({
      label: option.label,
      value: option.value,
    }));
    const isDisabled = dropdownState.disabled || props.disabled;
    return props.multiple ? (
      <MultiSelectPieceProperty
        placeholder={dropdownState.placeholder ?? t('Select an option')}
        options={selectOptions}
        loading={isPending}
        onChange={(value) => props.onChange(value)}
        disabled={isDisabled}
        initialValues={props.value as unknown[]}
        showDeselect={
          props.showDeselect &&
          !isNil(props.value) &&
          Array.isArray(props.value) &&
          props.value.length > 0 &&
          !isDisabled
        }
        showRefresh={!isPending && !readonly}
        onRefresh={refresh}
        refreshOnSearch={props.shouldRefreshOnSearch ? refresh : undefined}
        cachedOptions={firstDropdownState.current?.options ?? []}
      />
    ) : (
      <SearchableSelect
        options={selectOptions}
        disabled={dropdownState.disabled || props.disabled}
        loading={isPending}
        placeholder={dropdownState.placeholder ?? t('Select an option')}
        value={props.value}
        onChange={(value) => props.onChange(value)}
        showDeselect={
          props.showDeselect && !isNil(props.value) && !props.disabled
        }
        onRefresh={refresh}
        showRefresh={!isPending && !readonly}
        refreshOnSearch={props.shouldRefreshOnSearch ? refresh : undefined}
        cachedOptions={firstDropdownState.current?.options ?? []}
        rightContent={
          <div className="flex items-center gap-3"> 
            <Separator orientation="vertical" className='h-6'/>
            <AutoDynamicFields
              allowDynamicValues={props.allowDynamicValues}
              propertyName={props.propertyName}
              inputName={props.inputName}
              property={props.property}
              disabled={props.disabled}
            />
          </div>
        }
      />
    );
  },
);

const DynamicDropdownPieceProperty = React.memo(
  (props: SelectPiecePropertyProps) => {
    return (
      <DynamicPropertiesErrorBoundary>
        <DynamicDropdownPiecePropertyImplementation {...props} />
      </DynamicPropertiesErrorBoundary>
    );
  },
);
DynamicDropdownPieceProperty.displayName = 'DynamicDropdownPieceProperty';
DynamicDropdownPiecePropertyImplementation.displayName =
  'DynamicDropdownPiecePropertyImplementation';
export { DynamicDropdownPieceProperty };
