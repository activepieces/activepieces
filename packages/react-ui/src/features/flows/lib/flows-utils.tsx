import cronstrue from 'cronstrue/i18n';
import { t } from 'i18next';
import JSZip from 'jszip';
import { TimerReset, TriangleAlert, Zap } from 'lucide-react';

import { downloadFile } from '@/lib/utils';
import {
  Flow,
  FlowVersion,
  PopulatedFlow,
  TriggerType,
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

export const flowsUtils = {
  downloadFlow,
  zipFlows,
  flowStatusToolTipRenderer: (flow: Flow, version: FlowVersion) => {
    const trigger = version.trigger;
    switch (trigger.type) {
      case TriggerType.PIECE: {
        const cronExpression = flow.schedule?.cronExpression;
        return cronExpression
          ? `${t('Run')} ${cronstrue
              .toString(cronExpression, { locale: 'en' })
              .toLocaleLowerCase()}`
          : t('Real time flow');
      }
      case TriggerType.EMPTY:
        console.error(
          t("Flow can't be published with empty trigger {name}", {
            name: version.displayName,
          }),
        );
        return t('Please contact support as your published flow has a problem');
    }
  },
  flowStatusIconRenderer: (flow: Flow, version: FlowVersion) => {
    const trigger = version.trigger;
    switch (trigger.type) {
      case TriggerType.PIECE: {
        const cronExpression = flow.schedule?.cronExpression;
        if (cronExpression) {
          return <TimerReset className="h-4 w-4 text-foreground" />;
        } else {
          return <Zap className="h-4 w-4 text-foreground fill-foreground" />;
        }
      }
      case TriggerType.EMPTY: {
        console.error(
          t("Flow can't be published with empty trigger {name}", {
            name: version.displayName,
          }),
        );
        return <TriangleAlert className="h-4 w-4 text-destructive" />;
      }
    }
  },
};
