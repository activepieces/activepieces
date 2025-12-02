import cronstrue from 'cronstrue/i18n';
import { t } from 'i18next';
import JSZip from 'jszip';
import { TimerReset, TriangleAlert, Zap } from 'lucide-react';
import { Socket } from 'socket.io-client';

import { useApErrorDialogStore } from '@/components/custom/ap-error-dialog/ap-error-dialog-store';
import { toast } from '@/components/ui/use-toast';
import { downloadFile } from '@/lib/utils';
import {
  PopulatedFlow,
  FlowTriggerType,
  ExecutionError,
  ExecutionErrorType,
  FlowStatus,
  FlowOperationStatus,
  Flow,
  WebsocketClientEvent,
  getApErrorParams,
  ErrorCode,
  getExecutionError,
} from '@activepieces/shared';

import { flowsApi } from './flows-api';

const downloadFlow = async (flowId: string) => {
  const template = await flowsApi.getTemplate(flowId, {});
  downloadFile({
    obj: JSON.stringify(template, null, 2),
    fileName: template.name,
    extension: 'json',
  });
};

const zipFlows = async (flows: PopulatedFlow[]) => {
  const zip = new JSZip();
  for (const flow of flows) {
    const template = await flowsApi.getTemplate(flow.id, {});
    zip.file(
      `${flow.version.displayName}_${flow.id}.json`,
      JSON.stringify(template, null, 2),
    );
  }
  return zip;
};

const getExecutionUserError = (error: unknown): ExecutionError | null => {
  const apError = getApErrorParams(error, ErrorCode.TRIGGER_UPDATE_STATUS);
  if (!apError) return null;
  const executionError = getExecutionError(apError.standardError);
  if (!executionError) return null;
  if (executionError.type !== ExecutionErrorType.USER) return null;
  return executionError;
};

const updateStatusListener = (
  socket: Socket,
  callback: (
    operationStatus: FlowOperationStatus,
    newStatus?: FlowStatus,
  ) => void,
) => {
  const onUpdateFinish = ({
    flow: updatedFlow,
    status,
    error,
  }: {
    flow?: Flow;
    status: 'success' | 'failed';
    error?: unknown;
  }) => {
    if (status === 'failed') {
      const apError = getApErrorParams(error, undefined);
      const executionUserError = getExecutionUserError(error);
      toast({
        title: executionUserError?.name ?? t('Error'),
        description:
          executionUserError?.message ?? t('Failed to change flow status'),
        variant: 'destructive',
        showMore: apError
          ? () => useApErrorDialogStore.getState().openDialog(error)
          : undefined,
      });
    }
    callback(FlowOperationStatus.NONE, updatedFlow?.status);
    socket.off(WebsocketClientEvent.FLOW_STATUS_UPDATED, onUpdateFinish);
  };
  socket.on(WebsocketClientEvent.FLOW_STATUS_UPDATED, onUpdateFinish);
};

export const flowsUtils = {
  downloadFlow,
  zipFlows,
  updateStatusListener,
  flowStatusToolTipRenderer: (flow: PopulatedFlow) => {
    const trigger = flow.version.trigger;
    switch (trigger?.type) {
      case FlowTriggerType.PIECE: {
        const cronExpression = flow.triggerSource?.schedule?.cronExpression;
        return cronExpression
          ? `${t('Run')} ${cronstrue
              .toString(cronExpression, { locale: 'en' })
              .toLocaleLowerCase()}`
          : t('Real time flow');
      }
      case FlowTriggerType.EMPTY:
        console.error(
          t("Flow can't be published with empty trigger {name}", {
            name: flow.version.displayName,
          }),
        );
        return t('Please contact support as your published flow has a problem');
    }
  },
  flowStatusIconRenderer: (flow: PopulatedFlow) => {
    const trigger = flow.version.trigger;
    switch (trigger?.type) {
      case FlowTriggerType.PIECE: {
        const cronExpression = flow.triggerSource?.schedule?.cronExpression;
        if (cronExpression) {
          return <TimerReset className="h-4 w-4 text-foreground" />;
        } else {
          return <Zap className="h-4 w-4 text-foreground fill-foreground" />;
        }
      }
      case FlowTriggerType.EMPTY: {
        console.error(
          t("Flow can't be published with empty trigger {name}", {
            name: flow.version.displayName,
          }),
        );
        return <TriangleAlert className="h-4 w-4 text-destructive" />;
      }
    }
  },
};
