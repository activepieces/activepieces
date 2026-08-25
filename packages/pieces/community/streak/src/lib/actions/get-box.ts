import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { streakApiCall } from '../common/client';
import { flattenStreakBox } from '../common/flatten';
import { boxDropdown, pipelineDropdown } from '../common/props';
import { StreakBox } from '../common/types';

export const getBoxAction = createAction({
  auth: streakAuth,
  name: 'get_box',
  displayName: 'Get Box',
  description: 'Fetch a single box with its current stage, fields, and counts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve a single box by its box key, including its current stage, custom field values, and counts. Use when an agent already has a specific box key (e.g. from a trigger or a Find Boxes result) and needs its full current details. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    pipelineKey: pipelineDropdown,
    boxKey: boxDropdown,
  },
  async run(context) {
    const response = await streakApiCall<StreakBox>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/api/v1/boxes/${context.propsValue.boxKey}`,
    });
    return flattenStreakBox(response.body);
  },
});
