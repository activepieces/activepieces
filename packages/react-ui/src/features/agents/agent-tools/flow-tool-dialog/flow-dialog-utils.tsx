import { PopulatedFlow, FlowVersionState } from '@activepieces/shared';
import { t } from 'i18next';

const isFlowSelectable = (flow: PopulatedFlow) => {
  return (
    flow.version.state === FlowVersionState.LOCKED && flow.status === 'ENABLED'
  );
};

const getFlowTooltip = (flow: PopulatedFlow) => {
  if (flow.version.state !== FlowVersionState.LOCKED) {
    return t('Flow must be published to be selected');
  }
  if (flow.status !== 'ENABLED') {
    return t('Flow must be enabled to be selected');
  }
  return '';
};

export const flowDialogUtils = {
  isFlowSelectable,
  getFlowTooltip,
};
