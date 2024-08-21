import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { PiecePropertyMap } from '@activepieces/pieces-framework';
import { Action, Trigger } from '@activepieces/shared';

import { AutoPropertiesFormComponent } from './auto-properties-form';
import { Skeleton } from '@/components/ui/skeleton';

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

  const latestCallId = useRef<number>(0);

  const { mutate, isPending } = useMutation<
    PiecePropertyMap,
    Error,
    { input: Record<string, unknown>; callId: number }
  >({
    mutationFn: async ({ input, callId }) => {
      const { settings } = form.getValues();
      const actionOrTriggerName = settings.actionName ?? settings.triggerName;
      const { pieceName, pieceVersion, pieceType, packageType } = settings;

      // Perform the API request inside the mutation function
      const response = await piecesApi.options<PiecePropertyMap>({
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

      // If this isn't the latest call, ignore the result
      if (latestCallId.current !== callId) {
        throw new Error('Stale request');
      }

      return response;
    },
    onSuccess: (response) => {
      setPropertyMap(response);
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
    form.setValue(`settings.input.${props.propertyName}` as const, undefined, {
      shouldValidate: true,
    });
  }, refresherValues);

  return (
    <>
      {isPending && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="w-full h-4" />
          ))}
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
