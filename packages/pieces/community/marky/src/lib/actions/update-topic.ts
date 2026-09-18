import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyCommon } from '../common/client';
import { markyProps } from '../common/props';

export const updateTopicAction = createAction({
  auth: markyAuth,
  name: 'update_topic',
  displayName: 'Update Topic',
  description: 'Update an existing Marky topic.',
  audience: 'both',
  aiMetadata: {
    description:
      'Change the title, notes, category or enabled flag of an existing Marky topic. Disabling a topic stops Marky generating posts from it without deleting it — use Delete Topic to remove it. Applying the same values again is safe to retry.',
    idempotent: true,
  },
  props: {
    businessId: markyProps.businessId,
    topicId: markyProps.topicId,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title. Leave empty to keep the current one.',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'New notes or description. Leave empty to keep the current ones.',
      required: false,
    }),
    categoryId: Property.ShortText({
      displayName: 'Category ID',
      description: 'ID of the category to move this topic to.',
      required: false,
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Whether Marky may generate posts from this topic.',
      required: false,
    }),
  },
  async run(context) {
    const { businessId, topicId, title, body, categoryId, enabled } = context.propsValue;

    if (!title && !body && !categoryId && enabled === undefined) {
      throw new Error('Provide at least one field to update.');
    }

    const response = await markyCommon.apiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: `/businesses/${businessId}/topics/${topicId}`,
      body: {
        ...(title ? { title } : {}),
        ...(body ? { body } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(enabled === undefined ? {} : { enabled }),
      },
    });

    return response.body;
  },
});
