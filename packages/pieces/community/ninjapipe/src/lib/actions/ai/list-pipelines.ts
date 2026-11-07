import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiListPipelines = createAction({
  auth: ninjapipeAuth,
  name: 'ai_list_pipelines',
  classification: 'SEARCH',
  displayName: 'List Pipelines',
  description: 'Lists pipelines with their stages.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List NinjaPipe pipelines (boards) with their stages; each stage has the id that pipeline items use as stage_id. Each item has pipeline_type (deals, contacts, general). Returns one page with items, total, hasMore and nextPage. Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.pipelineList,
  props: {
    page: ninjapipeAiProps.page(),
    limit: ninjapipeAiProps.limit(),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.listPage({
      auth: ninjapipeClient.readAuth(context.auth),
      path: '/pipelines',
      page: ninjapipeClient.readPage(p.page),
      limit: ninjapipeClient.clampLimit({ value: p.limit }),
      operation: 'list pipelines',
    });
  },
});
