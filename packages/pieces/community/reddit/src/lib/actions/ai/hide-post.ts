import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditHidePostOutputSchema } from '../../output-schemas';

export const redditHidePost = createAction({
  auth: redditAuth,
  name: 'reddit_hide_post',
  outputSchema: redditHidePostOutputSchema,
  displayName: 'Hide Posts',
  description: 'Hides one or more posts from your listings.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Hides posts from your own front page and subreddit listings; nobody else is affected and Unhide Posts reverses it. Accepts comma-separated post ids with or without t3_. Needs the `report` scope: older connections must reconnect.',
    idempotent: true,
  },
  props: {
    post_ids: Property.ShortText({ displayName: 'Post IDs', description: 'Comma-separated post ids, e.g. "abc123,t3_def456".', required: true }),
  },
  async run({ auth, propsValue }) {
    const ids = toPostFullnames({ value: propsValue.post_ids });
    await redditApi.request<unknown>({ auth, method: HttpMethod.POST, path: '/api/hide', form: { id: ids.join(',') } });
    return { success: true, ids, hidden: true };
  },
});

function toPostFullnames({ value }: { value: string }): string[] {
  const ids = value
    .split(',')
    .filter((id) => id.trim() !== '')
    .map((id) => redditApi.toFullname({ value: id, prefix: 't3_' }));
  if (ids.length === 0) {
    throw new Error('Provide at least one post id.');
  }
  return ids;
}
