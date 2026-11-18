import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeItems } from '../common/pipeline-item-props';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const updatePipelineItem = createAction({
  auth: ninjapipeAuth,
  name: 'update_pipeline_item',
  classification: 'WRITE',
  displayName: 'Update Pipeline Item',
  description: 'Updates an item (card) of a pipeline or moves it to another stage. Fields left blank keep their value.',
  audience: 'human',
  aiMetadata: { description: 'Update or move a NinjaPipe pipeline item. Only filled fields change. Re-running with the same input gives the same result.', idempotent: true },
  outputSchema: ninjapipeSchemas.pipelineItem,
  props: {
    pipelineId: ninjapipeProps.pipelineRequired(),
    itemId: ninjapipeProps.pipelineItem(),
    stageId: ninjapipeProps.stageOptional(),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    ...ninjapipeItems.itemProps(),
    clearFields: ninjapipeProps.clearFields({ fields: ninjapipeItems.ITEM_CLEARABLE }),
  },
  async run(context) {
    const p = context.propsValue;
    const path = `/pipelines/${ninjapipeClient.pathId({ value: p.pipelineId, field: 'Pipeline' })}/items/${ninjapipeClient.pathId({ value: p.itemId, field: 'Pipeline Item' })}`;
    const body = ninjapipeFields.requireChanges({ body: ninjapipeFields.withClears({ body: ninjapipeItems.itemBody(p), clear: p.clearFields }), what: 'pipeline item' });
    return ninjapipeClient.sendRecord({ auth: ninjapipeClient.readAuth(context.auth), method: HttpMethod.PUT, path, body, operation: 'update pipeline item' });
  },
});
