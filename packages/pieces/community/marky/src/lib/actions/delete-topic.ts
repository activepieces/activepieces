import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyCommon } from '../common/client';
import { markyProps } from '../common/props';

export const deleteTopicAction = createAction({
  auth: markyAuth,
  name: 'delete_topic',
  displayName: 'Delete Topic',
  description: 'Delete a topic from a Marky business.',
  audience: 'both',
  aiMetadata: {
    description:
      'Soft-delete a Marky topic so it no longer steers post generation. Prefer Update Topic with Enabled turned off when the topic should come back later. A second call on the same topic errors, so retries are not safe.',
    idempotent: false,
  },
  props: {
    businessId: markyProps.businessId,
    topicId: markyProps.topicId,
  },
  async run(context) {
    const { businessId, topicId } = context.propsValue;

    const response = await markyCommon.apiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/businesses/${businessId}/topics/${topicId}`,
    });

    return response.body;
  },
});
