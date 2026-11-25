import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { streakApiCall } from '../common/client';
import { pipelineListOutputSchema } from '../common/output-schemas';
import { StreakPipeline } from '../common/types';

export const listPipelinesAction = createAction({
  auth: streakAuth,
  name: 'list_pipelines',
  classification: 'SEARCH',
  displayName: 'List Pipelines',
  description: 'List all pipelines the connected user can access.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List every Streak pipeline the connected user can access, returning each pipeline_key and name with stage and field counts. Use first to find the pipeline_key needed by List Stages, List Boxes, List Pipeline Fields and Create Box. Read-only and idempotent; takes no input.',
    idempotent: true,
  },
  outputSchema: pipelineListOutputSchema,
  props: {},
  async run(context) {
    const response = await streakApiCall<StreakPipeline[]>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/v1/pipelines',
    });
    return (response.body ?? []).map((p) => ({
      pipeline_key: p.pipelineKey ?? p.key,
      name: p.name,
      description: p.description ?? null,
      stage_count: Array.isArray(p.stageOrder) ? p.stageOrder.length : null,
      field_count: Array.isArray(p.fields) ? p.fields.length : null,
      creation_timestamp: p.creationTimestamp ?? null,
      last_updated_timestamp: p.lastUpdatedTimestamp ?? null,
    }));
  },
});
