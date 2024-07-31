import { useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { Action, Trigger, isNil } from '@activepieces/shared';
type SelectPiecePropertyProps = {
  refreshers: string[];
  propertyName: string;
};
const SelectPieceProperty = React.memo((props: SelectPiecePropertyProps) => {
  const [flowVersion] = useBuilderStateContext((state) => [state.flowVersion]);
  const form = useFormContext<Action | Trigger>();

  const newRefreshers = [...props.refreshers, 'auth'];

  const refresherValues = newRefreshers.map((refresher) =>
    useWatch({
      name: `settings.input.${refresher}` as const,
      control: form.control,
    }),
  );

  const {
    data: pieceOptions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['piece-options', props.propertyName],
    queryFn: async () => {
      const { settings } = form.getValues();
      const actionOrTriggerName = settings.actionName ?? settings.triggerName;
      const { pieceName, pieceVersion, pieceType, packageType } = settings;
      return piecesApi.options({
        pieceName,
        pieceVersion: pieceVersion.slice(1),
        pieceType,
        packageType,
        propertyName: props.propertyName,
        actionOrTriggerName: actionOrTriggerName,
        input: {},
        flowVersionId: flowVersion.id,
        flowId: flowVersion.flowId,
      });
    },
    staleTime: 0,
    enabled: !isNil(
      form.getValues().settings.actionName ??
        form.getValues().settings.triggerName,
    ),
  });

  useEffect(() => {}, refresherValues);

  return <div></div>;
});

SelectPieceProperty.displayName = 'SelectPieceProperty';
export { SelectPieceProperty };
