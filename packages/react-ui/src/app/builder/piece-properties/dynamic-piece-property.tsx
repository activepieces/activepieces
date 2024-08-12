import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { LoadingSpinner } from '@/components/ui/spinner';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { PiecePropertyMap } from '@activepieces/pieces-framework';
import { Action, Trigger } from '@activepieces/shared';

import { AutoPropertiesFormComponent } from './auto-properties-form';

type DynamicPropertiesProps = {
  refreshers: string[];
  propertyName: string;
  disabled: boolean;
};
const DynamicProperties = React.memo((props: DynamicPropertiesProps) => {
  const [flowVersion] = useBuilderStateContext((state) => [state.flowVersion]);
  const form = useFormContext<Action | Trigger>();

  const [propertyMap, setPropertyMap] = useState<PiecePropertyMap | undefined>(
    undefined,
  );
  const newRefreshers = [...props.refreshers, 'auth'];

  const { mutate, isPending } = useMutation<
    PiecePropertyMap,
    Error,
    Record<string, unknown>
  >({
    mutationFn: async (input) => {
      const { settings } = form.getValues();
      const actionOrTriggerName = settings.actionName ?? settings.triggerName;
      const { pieceName, pieceVersion, pieceType, packageType } = settings;
      return piecesApi.options({
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
    onSuccess: (response) => {
      setPropertyMap(response);
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

  useEffect(() => {
    const record: Record<string, unknown> = {};
    newRefreshers.forEach((refresher, index) => {
      record[refresher] = refresherValues[index];
    });
    mutate(record);
  }, refresherValues);

  return (
    <>
      {isPending && <LoadingSpinner></LoadingSpinner>}
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
