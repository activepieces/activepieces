import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { createClient, unwrapResource } from '../../common/client';
import { commonProps } from '../../common/props';
import { Topic } from '../../common/types';
import { assertIdPrefix } from '../../common/validation';

export const updateTopic = createAction({
  auth: hedyAuth,
  name: 'update-topic',
  displayName: 'Update Topic',
  description: 'Update an existing topic.',
  props: {
    topicId: commonProps.topicId,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name for the topic (max 100 characters).',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the topic (max 500 characters).',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description: 'Hex color code for the topic.',
      required: false,
    }),
    iconName: Property.ShortText({
      displayName: 'Icon Name',
      description: 'Material icon name.',
      required: false,
    }),
    topicContext: Property.LongText({
      displayName: 'Topic Context',
      description:
        'Custom instructions for AI processing (max 20,000 characters). Leave empty to clear.',
      required: false,
    }),
  },
  async run(context) {
    const topicId = assertIdPrefix(context.propsValue['topicId'] as string, 'topic_', 'Topic ID');
    const client = createClient(context.auth);
    const p = context.propsValue;

    const body: Record<string, unknown> = {};
    if (p['name']) body['name'] = p['name'];
    if (p['description'] !== undefined && p['description'] !== null) body['description'] = p['description'];
    if (p['color']) body['color'] = p['color'];
    if (p['iconName']) body['iconName'] = p['iconName'];
    if (p['topicContext'] !== undefined && p['topicContext'] !== null) {
      body['topicContext'] = p['topicContext'] === '' ? null : p['topicContext'];
    }

    if (Object.keys(body).length === 0) {
      throw new Error('At least one field must be provided for update.');
    }

    const response = await client.request<Topic>({
      method: HttpMethod.PATCH,
      path: `/topics/${topicId}`,
      body,
    });

    return unwrapResource(response);
  },
});
