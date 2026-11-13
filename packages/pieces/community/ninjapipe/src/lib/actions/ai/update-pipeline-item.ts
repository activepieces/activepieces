import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';
import { ninjapipeFields } from '../../common/fields';
import { ninjapipeItems } from '../../common/pipeline-item-props';

export const aiUpdatePipelineItem = createAction({
  auth: ninjapipeAuth,
  name: 'ai_update_pipeline_item',
  classification: 'WRITE',
  displayName: 'Update Pipeline Item',
  description: 'Updates or moves an item (card) of a pipeline.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change an item of a NinjaPipe pipeline by pipeline_id and item_id (from ai_list_pipeline_items); set stage_id to move it to another stage. Only the fields you give change; clear_fields empties them. Repeating the same call gives the same result.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.pipelineItem,
  props: {
    pipeline_id: ninjapipeAiProps.id({ displayName: 'Pipeline ID', description: 'Pipeline UUID from ai_list_pipelines.' }),
    item_id: ninjapipeAiProps.id({ displayName: 'Item ID', description: 'Item UUID from ai_list_pipeline_items.' }),
    stage_id: ninjapipeAiProps.optionalId({ displayName: 'Stage ID', description: 'Move the item to this stage id.' }),
    title: ninjapipeAiProps.text({ displayName: 'Title', description: 'New title.' }),
    description: ninjapipeAiProps.text({ displayName: 'Description', description: 'New details.' }),
    value: ninjapipeAiProps.number({ displayName: 'Value', description: 'New value.' }),
    priority: ninjapipeAiProps.choice({ displayName: 'Priority', description: 'New priority.', values: ninjapipeItems.ITEM_PRIORITIES }),
    assigned_to: ninjapipeAiProps.optionalId({ displayName: 'Assigned To', description: 'account_id from ai_list_workspace_members.' }),
    due_date: ninjapipeAiProps.text({ displayName: 'Due Date', description: 'YYYY-MM-DD.' }),
    clear_fields: ninjapipeAiProps.clearFields({ fields: Object.keys(ninjapipeItems.ITEM_CLEARABLE) }),
  },
  async run(context) {
    const p = context.propsValue;
    const path = `/pipelines/${ninjapipeClient.pathId({ value: p.pipeline_id, field: 'Pipeline ID' })}/items/${ninjapipeClient.pathId({ value: p.item_id, field: 'Item ID' })}`;
    const changes = ninjapipeItems.itemBody({
      title: p.title,
      stageId: p.stage_id,
      description: p.description,
      value: p.value,
      priority: p.priority,
      assignedTo: p.assigned_to,
      dueDate: p.due_date,
    });
    const body = ninjapipeFields.requireChanges({ body: ninjapipeFields.withClears({ body: changes, clear: p.clear_fields }), what: 'pipeline item' });
    return ninjapipeClient.sendRecord({ auth: ninjapipeClient.readAuth(context.auth), method: HttpMethod.PUT, path, body, operation: 'update pipeline item' });
  },
});
