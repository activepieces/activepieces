import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { HedyApiClient } from '../../common/client';
import { commonProps } from '../../common/props';
import { PaginatedResponse, Topic } from '../../common/types';
import { assertLimit } from '../../common/validation';

function toTopicArray(result: unknown): Topic[] {
  if (Array.isArray(result)) {
    return result as Topic[];
  }

  if (result && typeof result === 'object' && 'data' in result) {
    const data = (result as PaginatedResponse<Topic>).data;
    if (Array.isArray(data)) {
      return data;
    }
  }

  return [];
}

export const listTopics = createAction({
  auth: hedyAuth,
  name: 'list-topics',
  displayName: 'List Topics',
  description: 'Retrieve all topics from your Hedy workspace.',
  props: {
    returnAll: commonProps.returnAll,
    limit: commonProps.limit,
  },
  async run(context) {
    const client = new HedyApiClient(context.auth as string);
    const { returnAll, limit } = context.propsValue as {
      returnAll?: boolean;
      limit?: number;
    };

    const response = await client.request<Topic[]>({
      method: HttpMethod.GET,
      path: '/topics',
    });

    const topics = toTopicArray(response);

    if (!returnAll) {
      const limited = assertLimit(limit);
      return limited ? topics.slice(0, limited) : topics.slice(0, 50);
    }

    return topics;
  },
});
