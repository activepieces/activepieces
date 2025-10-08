import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { HedyApiClient, unwrapResource } from '../../common/client';
import { commonProps } from '../../common/props';
import { Topic } from '../../common/types';

export const getTopic = createAction({
  auth: hedyAuth,
  name: 'get-topic',
  displayName: 'Get Topic',
  description: 'Retrieve details for a specific topic.',
  props: {
    topicId: commonProps.topicId,
  },
  async run(context) {
    const topicId = context.propsValue.topicId as string;
    const client = new HedyApiClient(context.auth as string);
    const response = await client.request<Topic>({
      method: HttpMethod.GET,
      path: `/topics/${topicId}`,
    });

    return unwrapResource(response);
  },
});
