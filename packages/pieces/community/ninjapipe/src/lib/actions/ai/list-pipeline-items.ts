import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiListPipelineItems = createAction({
  auth: ninjapipeAuth,
  name: 'ai_list_pipeline_items',
  classification: 'SEARCH',
  displayName: 'List Pipeline Items',
  description: 'Lists the items (cards) of a pipeline.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List all items (cards) of one NinjaPipe pipeline (pipeline_id from ai_list_pipelines), optionally only those in stage_id. Returns every matching item in one call. Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.pipelineItemList,
  props: {
    pipeline_id: ninjapipeAiProps.id({ displayName: 'Pipeline ID', description: 'Pipeline UUID from ai_list_pipelines.' }),
    stage_id: ninjapipeAiProps.optionalId({ displayName: 'Stage ID', description: 'Only items in this stage (stage id from ai_list_pipelines).' }),
  },
  async run(context) {
    const p = context.propsValue;
    const body = await ninjapipeClient.ninjapipeRequest({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.GET,
      path: `/pipelines/${ninjapipeClient.pathId({ value: p.pipeline_id, field: 'Pipeline ID' })}/items`,
      operation: 'list pipeline items',
    });
    const stageId = typeof p.stage_id === 'string' ? p.stage_id.trim() : '';
    const items = ninjapipeClient.readItems(body).filter((item) => stageId === '' || item['stage_id'] === stageId);
    return { items, count: items.length };
  },
});
