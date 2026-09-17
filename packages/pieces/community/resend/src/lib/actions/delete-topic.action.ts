import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { deleteTopicOutputSchema } from '../output-schemas';

export const deleteTopic = createAction({
  name: 'delete_topic',
  classification: 'DESTRUCTIVE',
  auth: resendAuth,
  displayName: 'Delete Topic',
  outputSchema: deleteTopicOutputSchema,
  description: 'Permanently delete a topic',
  audience: 'ai',
  aiMetadata: { description: "Permanently deletes a topic by its ID, removing every contact's subscription state for it. Effectively idempotent — once deleted, repeating the call has no further effect.", idempotent: true },
  props: {
    topic_id: resendProps.topicId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ object: string; id: string; deleted: boolean }>({ auth: auth.secret_text, method: HttpMethod.DELETE, path: `/topics/${propsValue.topic_id}` });
  },
});
