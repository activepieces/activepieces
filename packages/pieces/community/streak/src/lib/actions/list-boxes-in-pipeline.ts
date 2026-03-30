import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { streakAuth } from '../auth';
import { pipelineKeyProp } from '../common/props';
import { streakRequest } from '../common/client';

export const listBoxesInPipelineAction = createAction({
  name: 'list_boxes_in_pipeline',
  displayName: 'List Boxes in Pipeline',
  description: 'List boxes contained in a Streak pipeline.',
  auth: streakAuth,
  props: {
    pipelineKey: pipelineKeyProp,
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      defaultValue: 100,
    }),
    page: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 0,
    }),
    sortBy: Property.ShortText({
      displayName: 'Sort By',
      description: 'Optional sort field such as lastUpdatedTimestamp.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {
      limit: String(propsValue.limit ?? 100),
      page: String(propsValue.page ?? 0),
    };

    if (propsValue.sortBy) {
      queryParams['sortBy'] = propsValue.sortBy;
    }

    const response = await streakRequest({
      apiKey: auth.props.api_key,
      method: HttpMethod.GET,
      path: `/v1/pipelines/${encodeURIComponent(propsValue.pipelineKey)}/boxes`,
      queryParams,
    });

    return response.body;
  },
});
