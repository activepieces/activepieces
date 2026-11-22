import { createAction } from '@activepieces/pieces-framework';
import { insightlyUtils } from '../common/client';
import { insightlyAuth, insightlyCommon, podProperty } from '../common/common';
import { insightlyDropdowns } from '../common/dropdowns';
import { outputSchemas } from '../common/output-schemas';

export const moveOpportunityStage = createAction({
  auth: insightlyAuth,
  name: 'move_opportunity_stage',
  classification: 'WRITE',
  displayName: 'Move Opportunity to Stage',
  description: 'Move an opportunity to a pipeline stage (switching pipeline if needed).',
  audience: 'human',
  outputSchema: outputSchemas['stageChange'],
  props: {
    pod: podProperty(),
    opportunityId: insightlyDropdowns.opportunityDropdown(),
    pipelineId: insightlyDropdowns.opportunityPipelineDropdown(),
    stageId: insightlyDropdowns.stageDropdown(),
  },
  async run(context) {
    const opportunityId = insightlyUtils.toId({ value: context.propsValue.opportunityId, label: 'Opportunity' });
    const pipelineId = insightlyUtils.toId({ value: context.propsValue.pipelineId, label: 'Pipeline' });
    const stageId = insightlyUtils.toId({ value: context.propsValue.stageId, label: 'Stage' });
    const connection = await insightlyCommon.connect({ auth: context.auth, pod: context.propsValue.pod });
    await insightlyCommon.setPipelineStage({ connection, objectName: 'Opportunities', recordId: opportunityId, pipelineId, stageId });
    return { opportunityId, pipelineId, stageId };
  },
});
