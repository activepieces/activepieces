import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { streakAuth } from '../auth';
import { streakRequest } from '../common/client';
import { pipelineKeyProp } from '../common/props';

export const getPipelineAction = createAction({
  name: 'get_pipeline',
  displayName: 'Get Pipeline',
  description: 'Retrieve a Streak pipeline by key.',
  auth: streakAuth,
  props: {
    pipelineKey: pipelineKeyProp,
  },
  async run({ auth, propsValue }) {
    const response = await streakRequest({
      apiKey: auth.props.api_key,
      method: HttpMethod.GET,
      path: `/v1/pipelines/${encodeURIComponent(propsValue.pipelineKey)}`,
    });

    return response.body;
  },
});
