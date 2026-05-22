import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { streakAuth } from '../../auth';
import { streakApiCall } from '../common/client';
import { flattenStreakBox } from '../common/flatten';
import { boxDropdown, pipelineDropdown } from '../common/props';
import { StreakBox } from '../common/types';

export const getBoxAction = createAction({
  auth: streakAuth,
  name: 'get_box',
  displayName: 'Get Box',
  description: 'Fetch a single box with its current stage, fields, and counts.',
  props: {
    pipelineKey: pipelineDropdown,
    boxKey: boxDropdown,
  },
  async run(context) {
    const response = await streakApiCall<StreakBox>({
      apiKey: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: `/api/v1/boxes/${context.propsValue.boxKey}`,
    });
    return flattenStreakBox(response.body);
  },
});
