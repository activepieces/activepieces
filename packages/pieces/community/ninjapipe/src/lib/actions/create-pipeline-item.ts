import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeItems } from '../common/pipeline-item-props';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const createPipelineItem = createAction({
  auth: ninjapipeAuth,
  name: 'create_pipeline_item',
  classification: 'WRITE',
  displayName: 'Create Pipeline Item',
  description: 'Adds an item (card) to a stage of a pipeline.',
  audience: 'human',
  aiMetadata: { description: 'Create an item (card) in a NinjaPipe pipeline stage. Not idempotent: each call adds another card.', idempotent: false },
  outputSchema: ninjapipeSchemas.pipelineItem,
  props: {
    pipelineId: ninjapipeProps.pipelineRequired(),
    stageId: ninjapipeProps.stageRequired(),
    title: Property.ShortText({ displayName: 'Title', required: true }),
    ...ninjapipeItems.itemProps(),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.sendRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.POST,
      path: `/pipelines/${ninjapipeClient.pathId({ value: p.pipelineId, field: 'Pipeline' })}/items`,
      body: ninjapipeItems.itemBody(p),
      operation: 'create pipeline item',
    });
  },
});
