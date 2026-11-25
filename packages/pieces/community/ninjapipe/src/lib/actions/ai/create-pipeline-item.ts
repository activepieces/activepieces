import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';
import { ninjapipeFields } from '../../common/fields';
import { ninjapipeItems } from '../../common/pipeline-item-props';

export const aiCreatePipelineItem = createAction({
  auth: ninjapipeAuth,
  name: 'ai_create_pipeline_item',
  classification: 'WRITE',
  displayName: 'Create Pipeline Item',
  description: 'Adds an item (card) to a pipeline stage.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Add an item (card) to a NinjaPipe pipeline: pipeline_id and stage_id come from ai_list_pipelines. Optional value, priority (low, medium, high), assigned_to (account_id), due_date (YYYY-MM-DD), email, phone and company name. Not idempotent: each call adds another card.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.pipelineItem,
  props: {
    pipeline_id: ninjapipeAiProps.id({ displayName: 'Pipeline ID', description: 'Pipeline UUID from ai_list_pipelines.' }),
    stage_id: ninjapipeAiProps.id({ displayName: 'Stage ID', description: 'Stage id of that pipeline, from ai_list_pipelines.' }),
    title: ninjapipeAiProps.text({ displayName: 'Title', description: 'Card title.', required: true }),
    description: ninjapipeAiProps.text({ displayName: 'Description', description: 'Card details.' }),
    value: ninjapipeAiProps.number({ displayName: 'Value', description: 'Value as a plain number.' }),
    priority: ninjapipeAiProps.choice({ displayName: 'Priority', description: 'Default medium.', values: ninjapipeItems.ITEM_PRIORITIES }),
    assigned_to: ninjapipeAiProps.optionalId({ displayName: 'Assigned To', description: 'account_id from ai_list_workspace_members.' }),
    due_date: ninjapipeAiProps.text({ displayName: 'Due Date', description: 'YYYY-MM-DD.' }),
    email: ninjapipeAiProps.text({ displayName: 'Email', description: 'Email shown on the card.' }),
    phone: ninjapipeAiProps.text({ displayName: 'Phone', description: 'Phone shown on the card.' }),
    company: ninjapipeAiProps.text({ displayName: 'Company', description: 'Company name shown on the card.' }),
  },
  async run(context) {
    const p = context.propsValue;
    const body = ninjapipeItems.itemBody({
      title: p.title,
      stageId: p.stage_id,
      description: p.description,
      value: p.value,
      priority: p.priority,
      assignedTo: p.assigned_to,
      dueDate: p.due_date,
      email: p.email,
      phone: p.phone,
      company: p.company,
    });
    return ninjapipeClient.sendRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.POST,
      path: `/pipelines/${ninjapipeClient.pathId({ value: p.pipeline_id, field: 'Pipeline ID' })}/items`,
      body: ninjapipeFields.requireChanges({ body, what: 'pipeline item' }),
      operation: 'create pipeline item',
    });
  },
});
