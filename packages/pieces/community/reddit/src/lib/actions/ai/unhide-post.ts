import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditHidePostOutputSchema } from '../../output-schemas';

export const redditUnhidePost = createAction({
  auth: redditAuth,
  name: 'reddit_unhide_post',
  outputSchema: redditHidePostOutputSchema,
  displayName: 'Unhide Posts',
  description: 'Unhides one or more posts you previously hid.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Restores posts hidden with Hide Posts to your listings. Accepts comma-separated post ids with or without t3_; List User Content (where = hidden) lists hidden posts. Needs the `report` scope: older connections must reconnect.',
    idempotent: true,
  },
  props: {
    post_ids: Property.ShortText({ displayName: 'Post IDs', description: 'Comma-separated post ids, e.g. "abc123,t3_def456".', required: true }),
  },
  async run({ auth, propsValue }) {
    const ids = propsValue.post_ids
      .split(',')
      .filter((id) => id.trim() !== '')
      .map((id) => redditApi.toFullname({ value: id, prefix: 't3_' }));
    if (ids.length === 0) {
      throw new Error('Provide at least one post id.');
    }
    await redditApi.request<unknown>({ auth, method: HttpMethod.POST, path: '/api/unhide', form: { id: ids.join(',') } });
    return { success: true, ids, hidden: false };
  },
});
