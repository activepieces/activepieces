import { createAction } from '@activepieces/pieces-framework';
import { postizAuth } from '../common/auth';
import { aiCreatedPostOutputSchema, aiPostProps, createAiPost } from '../common/post-body';

export const aiPublishPostNow = createAction({
  auth: postizAuth,
  name: 'ai_publish_post_now',
  classification: 'WRITE',
  displayName: 'Publish Post Now',
  description: 'Publishes a post on one channel right away.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publishes a post publicly on one connected Postiz channel immediately; it cannot be unpublished from here. Only use when the user clearly asked to post now; otherwise prefer Create Draft Post or Schedule Post. Needs a channel ID from List Channels; media must be IDs or paths from Upload File from URL or List Media; settings follow Get Channel Settings and the platform type is filled in automatically. Not idempotent: each call publishes a new post.',
    idempotent: false,
  },
  outputSchema: aiCreatedPostOutputSchema,
  props: aiPostProps(),
  async run({ auth, propsValue }) {
    return createAiPost({
      auth,
      type: 'now',
      date: new Date().toISOString(),
      propsValue,
    });
  },
});
