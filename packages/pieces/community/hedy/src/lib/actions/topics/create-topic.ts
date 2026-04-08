import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { createClient, unwrapResource } from '../../common/client';
import { Topic } from '../../common/types';

export const createTopic = createAction({
  auth: hedyAuth,
  name: 'create-topic',
  displayName: 'Create Topic',
  description: 'Create a new topic for organizing sessions.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the topic (max 100 characters).',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the topic (max 500 characters).',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description: 'Hex color code for the topic (e.g. #4A90D9).',
      required: false,
    }),
    iconName: Property.ShortText({
      displayName: 'Icon Name',
      description: 'Material icon name (e.g. groups).',
      required: false,
    }),
    topicContext: Property.LongText({
      displayName: 'Topic Context',
      description:
        'Custom instructions for AI processing of sessions in this topic (max 20,000 characters).',
      required: false,
    }),
  },
  async run(context) {
    const client = createClient(context.auth);
    const p = context.propsValue;

    const body: Record<string, unknown> = { name: p['name'] };
    if (p['description']) body['description'] = p['description'];
    if (p['color']) body['color'] = p['color'];
    if (p['iconName']) body['iconName'] = p['iconName'];
    if (p['topicContext']) body['topicContext'] = p['topicContext'];

    const response = await client.request<Topic>({
      method: HttpMethod.POST,
      path: '/topics',
      body,
    });

    return unwrapResource(response);
  },
});
