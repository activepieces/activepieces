import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditSaveContentOutputSchema } from '../../output-schemas';

export const redditUnsaveContent = createAction({
  auth: redditAuth,
  name: 'reddit_unsave_content',
  outputSchema: redditSaveContentOutputSchema,
  displayName: 'Unsave Post or Comment',
  description: 'Removes a post or comment from your saved items.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Removes a post (t3_) or comment (t1_) from your saved items; harmless when it is not saved. Needs the `save` scope: older connections must reconnect.',
    idempotent: true,
  },
  props: {
    thing_id: Property.ShortText({ displayName: 'Fullname', description: 'Fullname of the post or comment, e.g. "t3_abc123".', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = redditApi.requireFullname({ value: propsValue.thing_id, label: 'Fullname' });
    await redditApi.request<unknown>({ auth, method: HttpMethod.POST, path: '/api/unsave', form: { id } });
    return { success: true, id, saved: false };
  },
});
