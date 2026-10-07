import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { getTopicOutputSchema } from '../output-schemas';

export const getTopic = createAction({
  name: 'get_topic',
  classification: 'READ',
  auth: resendAuth,
  displayName: 'Get Topic',
  outputSchema: getTopicOutputSchema,
  description: 'Retrieve a single topic by its ID',
  audience: 'ai',
  aiMetadata: { description: 'Retrieves the full details of a single topic (name, description, default subscription, visibility) by its ID. Use List Topics to find the ID. Read-only and idempotent.', idempotent: true },
  props: {
    topic_id: resendProps.topicId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest({ auth: auth.secret_text, method: HttpMethod.GET, path: `/topics/${propsValue.topic_id}` });
  },
});
