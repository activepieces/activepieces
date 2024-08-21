import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { DropdownState } from '@activepieces/pieces-framework';
import { Action, Trigger } from '@activepieces/shared';

import { MultiSelectPieceProperty } from './multi-select-piece-property';

type SelectPiecePropertyProps = {
  refreshers: string[];
  propertyName: string;
  initialValue?: unknown;
  multiple?: boolean;
  disabled: boolean;
  onChange: (value: unknown | undefined) => void;
};
const DynamicDropdownPieceProperty = React.memo(
  (props: SelectPiecePropertyProps) => {
    const [flowVersion] = useBuilderStateContext((state) => [
      state.flowVersion,
    ]);
    const form = useFormContext<Action | Trigger>();

    const newRefreshers = [...props.refreshers, 'auth'];
    const [dropdownState, setDropdownState] = useState<DropdownState<unknown>>({
      disabled: false,
      placeholder: t('Select an option'),
      options: [],
    });
    const latestCallId = useRef<number>(0);
    const { mutate, isPending } = useMutation<
      DropdownState<unknown>,
      Error,
      { input: Record<string, unknown>; callId: number }
    >({
      mutationFn: async ({ input, callId }) => {
        const { settings } = form.getValues();
        const actionOrTriggerName = settings.actionName ?? settings.triggerName;
        const { pieceName, pieceVersion, pieceType, packageType } = settings;
        const response = piecesApi.options<DropdownState<unknown>>({
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
        if (latestCallId.current !== callId) {
          throw new Error('Stale request');
        }
        return response;
      },
      onSuccess: (response) => {
        setDropdownState(response);
      },
      onError: (error) => {
        if (error.message !== 'Stale request') {
          console.error(error);
        }
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

    useEffect(() => {
      const input: Record<string, unknown> = {};
      newRefreshers.forEach((refresher, index) => {
        input[refresher] = refresherValues[index];
      });
      const callId = ++latestCallId.current;
      mutate({ input, callId });
      props.onChange(undefined);
    }, refresherValues);

    const selectOptions = dropdownState.options.map((option) => ({
      label: option.label,
      value: option.value as React.Key,
    }));
    return props.multiple ? (
      <MultiSelectPieceProperty
        placeholder={dropdownState.placeholder ?? t('Select an option')}
        options={selectOptions}
        onChange={(value) => props.onChange(value)}
        disabled={dropdownState.disabled || props.disabled}
        initialValues={props.initialValue as unknown[]}
      />
    ) : (
      <SearchableSelect
        options={selectOptions}
        disabled={dropdownState.disabled || props.disabled}
        loading={isPending}
        placeholder={dropdownState.placeholder ?? t('Select an option')}
        value={props.initialValue as React.Key}
        onChange={(value) => props.onChange(value)}
      />
    );
  },
);

DynamicDropdownPieceProperty.displayName = 'DynamicDropdownPieceProperty';
export { DynamicDropdownPieceProperty };
