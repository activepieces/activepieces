import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { streakApiCall } from '../common/client';
import { pipelineDropdown } from '../common/props';
import { StreakStage } from '../common/types';

export const createStageAction = createAction({
  auth: streakAuth,
  name: 'create_stage',
  displayName: 'Create Stage',
  description: 'Add a new stage (column) to a pipeline.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add a new stage (a pipeline column representing a step like "Negotiating") to the specified pipeline. Use when an agent needs to extend a pipeline\'s set of stages before placing boxes in them; requires the target pipeline and a stage name. Not idempotent: each call appends another stage even with the same name.',
    idempotent: false,
  },
  props: {
    pipelineKey: pipelineDropdown,
    name: Property.ShortText({
      displayName: 'Stage Name',
      description:
        'The name of the new stage. Must be unique within the pipeline (e.g. "Negotiating").',
      required: true,
    }),
  },
  async run(context) {
    const response = await streakApiCall<StreakStage>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: `/api/v1/pipelines/${context.propsValue.pipelineKey}/stages`,
      contentType: 'application/x-www-form-urlencoded',
      body: new URLSearchParams({ name: context.propsValue.name }).toString(),
    });
    return {
      stage_key: response.body.key,
      name: response.body.name,
    };
  },
});
