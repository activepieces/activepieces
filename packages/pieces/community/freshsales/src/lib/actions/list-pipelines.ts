import { createAction } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesProps } from '../common/props';
import { listPipelinesOutputSchema } from '../output-schemas';

export const listPipelines = createAction({
  auth: freshsalesAuth,
  name: 'list_pipelines',
  displayName: 'List Pipelines and Stages',
  description: 'List deal pipelines with their stages',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every Freshsales deal pipeline with its stages (id, name, position). Use it to resolve a pipeline or stage name to the IDs needed by Create Deal and Update Deal.',
    idempotent: true,
  },
  outputSchema: listPipelinesOutputSchema,
  props: {
  },
  async run(context) {
    const pipelines = await freshsalesProps.fetchSelector({
      auth: context.auth,
      path: '/api/selector/deal_pipelines',
    });
    const result = [];
    for (const pipeline of pipelines) {
      const stages = await freshsalesProps.fetchSelector({
        auth: context.auth,
        path: `/api/selector/deal_pipelines/${encodeURIComponent(pipeline.id)}/deal_stages`,
      });
      result.push({
        id: pipeline.id,
        name: pipeline.name,
        stages: stages.map((stage) => ({
          id: stage.id,
          name: stage.name,
          position: stage.position ?? null,
        })),
      });
    }
    return { pipelines: result };
  },
});
