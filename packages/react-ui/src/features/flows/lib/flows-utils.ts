import { FlowTemplate, PopulatedFlow, TriggerType } from '@activepieces/shared';

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

const downloadFlow = (flow: FlowTemplate) => {
  downloadFile(JSON.stringify(flow, null, 2), flow.name, 'json');
};

export const flowsUtils = {
  downloadFlow,
  flowStatusToolTipRenderer: (flow: PopulatedFlow) => {
    const trigger = flow.version.trigger;
    switch (trigger.type) {
      case TriggerType.PIECE: {
        const cronExpression = flow.schedule?.cronExpression;
        return cronExpression
          ? `Running every ${cronExpression}`
          : 'Real time flow';
      }
      case TriggerType.EMPTY:
        console.error(
          "Flow can't be published with empty trigger " +
            flow.version.displayName,
        );
        return 'Please contact support as your published flow has a problem';
    }
  },
  flowStatusIconRenderer: (flow: PopulatedFlow) => {
    const trigger = flow.version.trigger;
    switch (trigger.type) {
      case TriggerType.PIECE: {
        const cronExpression = flow.schedule?.cronExpression;
        if (cronExpression) {
          return 'timer-reset';
        } else {
          return 'zap';
        }
      }
      case TriggerType.EMPTY: {
        console.error(
          "Flow can't be published with empty trigger " +
            flow.version.displayName,
        );
        return 'warn';
      }
    }
  },
};
