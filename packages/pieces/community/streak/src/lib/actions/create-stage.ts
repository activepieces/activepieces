import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../../auth';
import { streakApiCall } from '../common/client';
import { pipelineDropdown } from '../common/props';
import { StreakStage } from '../common/types';

export const createStageAction = createAction({
  auth: streakAuth,
  name: 'create_stage',
  displayName: 'Create Stage',
  description: 'Add a new stage (column) to a pipeline.',
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
      apiKey: context.auth as unknown as string,
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
