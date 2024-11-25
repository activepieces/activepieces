import { useMutation } from '@tanstack/react-query';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { DropdownState } from '@activepieces/pieces-framework';
import { Action, isNil, Trigger } from '@activepieces/shared';

import { MultiSelectPieceProperty } from '../../../components/custom/multi-select-piece-property';

type SelectPiecePropertyProps = {
  refreshers: string[];
  propertyName: string;
  value?: unknown;
  multiple?: boolean;
  disabled: boolean;
  onChange: (value: unknown | undefined) => void;
  showDeselect?: boolean;
};
const DynamicDropdownPieceProperty = React.memo(
  (props: SelectPiecePropertyProps) => {
    const [flowVersion] = useBuilderStateContext((state) => [
      state.flowVersion,
    ]);
    const form = useFormContext<Action | Trigger>();
    const isFirstRender = useRef(true);
    const previousValues = useRef<undefined | unknown[]>(undefined);

    const newRefreshers = [...props.refreshers, 'auth'];
    const [dropdownState, setDropdownState] = useState<DropdownState<unknown>>({
      disabled: false,
      placeholder: t('Select an option'),
      options: [],
    });
    const { mutate, isPending } = useMutation<
      DropdownState<unknown>,
      Error,
      { input: Record<string, unknown> }
    >({
      mutationFn: async ({ input }) => {
        const { settings } = form.getValues();
        const actionOrTriggerName = settings.actionName ?? settings.triggerName;
        const { pieceName, pieceVersion, pieceType, packageType } = settings;
        return piecesApi.options<DropdownState<unknown>>({
          pieceName,
          pieceVersion,
          pieceType,
          packageType,
          propertyName: props.propertyName,
          actionOrTriggerName: actionOrTriggerName,
          input: input,
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
    const refresh = () => {
      const input: Record<string, unknown> = {};
      newRefreshers.forEach((refresher, index) => {
        input[refresher] = refresherValues[index];
      });
      mutate(
        { input },
        {
          onSuccess: (response) => {
            setDropdownState(response);
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
      value: option.value as React.Key,
    }));
    return props.multiple ? (
      <MultiSelectPieceProperty
        placeholder={dropdownState.placeholder ?? t('Select an option')}
        options={selectOptions}
        loading={isPending}
        onChange={(value) => props.onChange(value)}
        disabled={dropdownState.disabled || props.disabled}
        initialValues={props.value as unknown[]}
        showDeselect={
          props.showDeselect &&
          !isNil(props.value) &&
          Array.isArray(props.value) &&
          props.value.length > 0 &&
          !props.disabled &&
          !dropdownState.disabled
        }
        showRefresh={!props.disabled && !dropdownState.disabled}
        onRefresh={refresh}
      />
    ) : (
      <SearchableSelect
        options={selectOptions}
        disabled={dropdownState.disabled || props.disabled}
        loading={isPending}
        placeholder={dropdownState.placeholder ?? t('Select an option')}
        value={props.value as React.Key}
        onChange={(value) => props.onChange(value)}
        showDeselect={
          props.showDeselect && !isNil(props.value) && !props.disabled
        }
        onRefresh={refresh}
        showRefresh={!props.disabled && !dropdownState.disabled}
      />
    );
  },
);

DynamicDropdownPieceProperty.displayName = 'DynamicDropdownPieceProperty';
export { DynamicDropdownPieceProperty };
