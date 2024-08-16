import cronstrue from 'cronstrue/i18n';
import { t } from 'i18next';
import { TimerReset, TriangleAlert, Zap } from 'lucide-react';

import { Flow, FlowVersion, TriggerType } from '@activepieces/shared';

import { flowsApi } from './flows-api';

const downloadFile = (
  obj: any,
  fileName: string,
  extension: 'txt' | 'json',
) => {
  const blob = new Blob([obj], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadFlow = async (flowId: string) => {
  const template = await flowsApi.getTemplate(flowId, {});
  downloadFile(JSON.stringify(template, null, 2), template.name, 'json');
};

export const flowsUtils = {
  downloadFlow,
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
