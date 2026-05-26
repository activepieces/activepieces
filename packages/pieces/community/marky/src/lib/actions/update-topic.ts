import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyClient, TopicUpdateRequest } from '../common/client';
import { markyProps } from '../common/props';
import { markyUtils } from '../common/utils';

const updateTopicAction = createAction({
  auth: markyAuth,
  name: 'update-topic',
  displayName: 'Update Topic',
  description: 'Update an existing Marky topic.',
  props: {
    businessId: markyProps.business(),
    topicId: markyProps.topic(),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New topic title. Leave empty to keep current value.',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'New topic description. Leave empty to keep current value.',
      required: false,
    }),
    categoryId: Property.ShortText({
      displayName: 'Category ID',
      description: 'New category ID.',
      required: false,
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Whether the topic is active for post generation.',
      required: false,
    }),
  },
  async run(context) {
    const topicId = markyUtils.getRequiredString({
      value: context.propsValue.topicId,
      fieldName: 'Topic',
    });
    const title = markyUtils.getOptionalString({
      value: context.propsValue.title,
    });
    const body = markyUtils.getOptionalString({
      value: context.propsValue.body,
    });
    const categoryId = markyUtils.getOptionalString({
      value: context.propsValue.categoryId,
    });
    const enabled = markyUtils.getOptionalBoolean({
      value: context.propsValue.enabled,
      fieldName: 'Enabled',
    });

    if (
      title === undefined &&
      body === undefined &&
      categoryId === undefined &&
      enabled === undefined
    ) {
      throw new Error('Provide at least one field to update.');
    }

    const request: TopicUpdateRequest = {};
    if (title !== undefined) request.title = title;
    if (body !== undefined) request.body = body;
    if (categoryId !== undefined) request.category_id = categoryId;
    if (enabled !== undefined) request.enabled = enabled;

    const result = await markyClient.updateTopic({
      apiKey: context.auth.secret_text,
      topicId,
      body: request,
    });

    if (!result.ok) {
      throw new Error(`Failed to update topic: ${result.message}`);
    }

    return result.data;
  },
});

export { updateTopicAction };
