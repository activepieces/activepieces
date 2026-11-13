import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { streakApiCall } from '../common/client';
import { stageListOutputSchema } from '../common/output-schemas';
import { StreakStage } from '../common/types';

export const listStagesAction = createAction({
  auth: streakAuth,
  name: 'list_stages',
  classification: 'SEARCH',
  displayName: 'List Stages',
  description: 'List the stages of a pipeline.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the stages (columns such as Lead or Closed Won) of one Streak pipeline, returning each stage_key and name. Use to get the stage_key for Create Box or Update Box; requires a pipeline_key from List Pipelines. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: stageListOutputSchema,
  props: {
    pipeline_key: Property.ShortText({
      displayName: 'Pipeline Key',
      description: 'The pipeline key (from List Pipelines).',
      required: true,
    }),
  },
  async run(context) {
    const response = await streakApiCall<Record<string, StreakStage>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/api/v1/pipelines/${encodeURIComponent(context.propsValue.pipeline_key.trim())}/stages`,
    });
    return Object.values(response.body ?? {}).map((s) => ({
      stage_key: s.key,
      name: s.name,
    }));
  },
});
