import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyClient, TopicCreateRequest } from '../common/client';
import { markyProps } from '../common/props';
import { markyUtils } from '../common/utils';

const createTopicAction = createAction({
  auth: markyAuth,
  name: 'create-topic',
  displayName: 'Create Topic',
  description:
    'Create a new topic for a Marky business. Topics guide the AI when generating posts.',
  props: {
    businessId: markyProps.business(),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Topic title.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Topic description or notes used as context for generation.',
      required: false,
    }),
    categoryId: Property.ShortText({
      displayName: 'Category ID',
      description: 'Optional category ID to group this topic under.',
      required: false,
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Whether the topic is active for post generation.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const businessId = markyUtils.getRequiredString({
      value: context.propsValue.businessId,
      fieldName: 'Business',
    });
    const title = markyUtils.getRequiredString({
      value: context.propsValue.title,
      fieldName: 'Title',
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

    const request: TopicCreateRequest = { business_id: businessId, title };
    if (body !== undefined) request.body = body;
    if (categoryId !== undefined) request.category_id = categoryId;
    if (enabled !== undefined) request.enabled = enabled;

    const result = await markyClient.createTopic({
      apiKey: context.auth.secret_text,
      body: request,
    });

    if (!result.ok) {
      throw new Error(`Failed to create topic: ${result.message}`);
    }

    return result.data;
  },
});

export { createTopicAction };
