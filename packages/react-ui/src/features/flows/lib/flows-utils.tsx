import cronstrue from 'cronstrue/i18n';
import { t } from 'i18next';
import JSZip from 'jszip';
import { TimerReset, TriangleAlert, Zap } from 'lucide-react';

import { downloadFile } from '@/lib/utils';
import { PopulatedFlow, FlowTriggerType, ActivepiecesError, parseToJsonIfPossible, ExecutionError, ExecutionErrorType } from '@activepieces/shared';

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

const getApErrorParams = (error: unknown): ActivepiecesError | null => {
  const err = error as ActivepiecesError;
  if (!err.error || !(err.error.params)) return null;
  return err
};

const getExecutionUserError = (error: unknown): ExecutionError | null => {
  const apError = getApErrorParams(error);
  const params = apError?.error.params;
  if (!params || !("standardError" in params)) return null;

  const standardError: unknown = params?.standardError;
  if (typeof standardError !== 'string') return null;
  const errorPrefix = 'Error handling operation:';
  if (!standardError.startsWith(errorPrefix)) return null;

  const executionError = parseToJsonIfPossible(standardError.slice(errorPrefix.length)) as ExecutionError;

  if (
    !executionError ||
    typeof executionError !== 'object' ||
    typeof executionError.type !== 'string' ||
    typeof executionError.message !== 'string' ||
    typeof executionError.name !== 'string'
  ) {
    return null;
  }
  if (executionError.type !== ExecutionErrorType.USER) return null;

  return executionError;
};

export const flowsUtils = {
  downloadFlow,
  zipFlows,
  getExecutionUserError,
  getApErrorParams,
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
