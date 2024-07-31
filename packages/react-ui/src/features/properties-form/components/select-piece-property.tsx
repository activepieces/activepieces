import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { DropdownState } from '@activepieces/pieces-framework';
import { Action, Trigger } from '@activepieces/shared';

type SelectPiecePropertyProps = {
  refreshers: string[];
  propertyName: string;
  intialValue: React.Key;
  onChange: (value: unknown | undefined) => void;
};
const SelectPieceProperty = React.memo((props: SelectPiecePropertyProps) => {
  const [flowVersion] = useBuilderStateContext((state) => [state.flowVersion]);
  const form = useFormContext<Action | Trigger>();

  const [loading, setLoading] = useState(false);
  const newRefreshers = [...props.refreshers, 'auth'];
  const [dropdownState, setDropdownState] = useState<DropdownState<unknown>>({
    disabled: false,
    placeholder: 'Select a option',
    options: [],
  });

  const { mutate } = useMutation<
    DropdownState<unknown>,
    Error,
    Record<string, unknown>
  >({
    mutationFn: async (input) => {
      setLoading(true);
      const { settings } = form.getValues();
      const actionOrTriggerName = settings.actionName ?? settings.triggerName;
      const { pieceName, pieceVersion, pieceType, packageType } = settings;
      return piecesApi.options({
        pieceName,
        // TODO remove this hack and make the backend support versions with leading symbol
        pieceVersion: pieceVersion.slice(1),
        pieceType,
        packageType,
        propertyName: props.propertyName,
        actionOrTriggerName: actionOrTriggerName,
        input: input,
        flowVersionId: flowVersion.id,
        flowId: flowVersion.flowId,
      });
    },
    onSuccess: (response) => {
      setLoading(false);
      setDropdownState(response);
      console.log(response);
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const refresherValues = newRefreshers.map((refresher) =>
    useWatch({
      name: `settings.input.${refresher}` as const,
      control: form.control,
    }),
  );

  useEffect(() => {
    const record: Record<string, unknown> = {};
    newRefreshers.forEach((refresher, index) => {
      record[refresher] = refresherValues[index];
    });
    mutate(record);
  }, refresherValues);

  const selectOptions = dropdownState.options.map((option) => ({
    label: option.label,
    value: option.value as React.Key,
  }));

  return (
    <SearchableSelect
      options={selectOptions}
      disabled={dropdownState.disabled}
      loading={loading}
      placeholder={dropdownState.placeholder ?? 'Select a option'}
      value={props.intialValue}
      onChange={(value) => props.onChange(value)}
    />
  );
});

SelectPieceProperty.displayName = 'SelectPieceProperty';
export { SelectPieceProperty };
