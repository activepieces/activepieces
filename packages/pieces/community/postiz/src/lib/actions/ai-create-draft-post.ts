import { createAction } from '@activepieces/pieces-framework';
import { postizAuth } from '../common/auth';
import { aiCreatedPostOutputSchema, aiPostProps, createAiPost } from '../common/post-body';

export const aiCreateDraftPost = createAction({
  auth: postizAuth,
  name: 'ai_create_draft_post',
  classification: 'WRITE',
  displayName: 'Create Draft Post',
  description: 'Saves a post as a draft on one channel without publishing it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Saves a post as a draft on one connected Postiz channel; nothing is published. Use when content should be reviewed before it goes out. Needs a channel ID from List Channels; media must be IDs or paths from Upload File from URL or List Media; settings follow Get Channel Settings and the platform type is filled in automatically. Later use Change Post Status to schedule it. Not idempotent: each call creates a new draft.',
    idempotent: false,
  },
  outputSchema: aiCreatedPostOutputSchema,
  props: aiPostProps(),
  async run({ auth, propsValue }) {
    return createAiPost({
      auth,
      type: 'draft',
      date: new Date().toISOString(),
      propsValue,
    });
  },
});
