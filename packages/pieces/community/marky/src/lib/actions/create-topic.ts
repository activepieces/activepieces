import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyCommon } from '../common/client';
import { markyProps } from '../common/props';

export const createTopicAction = createAction({
  auth: markyAuth,
  name: 'create_topic',
  displayName: 'Create Topic',
  description: 'Create a topic for a Marky business. Topics steer what the AI writes about.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add a topic to a Marky business so generated posts stay on that subject. Use Update Topic to change one that already exists. Each call creates a new topic, so retries duplicate.',
    idempotent: false,
  },
  props: {
    businessId: markyProps.businessId,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Short name of the topic, e.g. "Customer stories".',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Notes or a description giving the AI context when it writes about this topic.',
      required: false,
    }),
    categoryId: Property.ShortText({
      displayName: 'Category ID',
      description: 'ID of a category to group this topic under.',
      required: false,
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Whether Marky may generate posts from this topic.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { businessId, title, body, categoryId, enabled } = context.propsValue;

    const response = await markyCommon.apiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/businesses/${businessId}/topics`,
      body: {
        title,
        ...(body ? { body } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(enabled === undefined ? {} : { enabled }),
      },
    });

    return response.body;
  },
});
