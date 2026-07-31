import {
  PopulatedFlow,
  FlowTriggerType,
  TriggerSourceScheduleType,
} from '@activepieces/shared';
import cronstrue from 'cronstrue/i18n';
import { t } from 'i18next';
import JSZip from 'jszip';
import { TimerReset, TriangleAlert, Zap } from 'lucide-react';

import { downloadFile } from '@/lib/dom-utils';

import { flowsApi } from '../api/flows-api';

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
  flowStatusToolTipRenderer: (flow: PopulatedFlow) => {
    const trigger = flow.version.trigger;
    switch (trigger?.type) {
      case FlowTriggerType.PIECE: {
        const schedule = flow.triggerSource?.schedule;
        switch (schedule?.type) {
          case TriggerSourceScheduleType.INTERVAL:
            return t(
              'Run every {minutes, plural, =1 {minute} other {# minutes}}',
              { minutes: Math.round(schedule.intervalMs / 60_000) },
            );
          case TriggerSourceScheduleType.CRON_EXPRESSION:
            return `${t('Run')} ${cronstrue
              .toString(schedule.cronExpression, { locale: 'en' })
              .toLocaleLowerCase()}`;
          default:
            return t('Real time flow');
        }
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
        if (flow.triggerSource?.schedule) {
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
