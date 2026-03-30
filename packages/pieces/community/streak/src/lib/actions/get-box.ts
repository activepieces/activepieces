import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { streakAuth } from '../auth';
import { boxKeyProp, pipelineKeyProp } from '../common/props';
import { streakRequest } from '../common/client';

export const getBoxAction = createAction({
  name: 'get_box',
  displayName: 'Get Box',
  description: 'Retrieve a Streak box by key.',
  auth: streakAuth,
  props: {
    pipelineKey: pipelineKeyProp,
    boxKey: boxKeyProp,
  },
  async run({ auth, propsValue }) {
    const response = await streakRequest({
      apiKey: auth.props.api_key,
      method: HttpMethod.GET,
      path: `/v1/boxes/${encodeURIComponent(propsValue.boxKey)}`,
    });

    return response.body;
  },
});
