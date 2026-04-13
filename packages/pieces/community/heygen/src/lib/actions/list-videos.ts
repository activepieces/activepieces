import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { heygenApiCall } from '../common/client';
import { heygenAuth } from '../common/auth';

export const listVideosAction = createAction({
  auth: heygenAuth,
  name: 'list_videos',
  displayName: 'List Videos',
  description: 'Retrieve a list of all generated videos.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of videos to retrieve (max 100).',
      required: false,
      defaultValue: 20,
    }),
  },
  async run({ propsValue, auth }) {
    return await heygenApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/video.list',
      query: { limit: propsValue.limit ?? 20 },
      apiVersion: 'v1',
    });
  },
});
