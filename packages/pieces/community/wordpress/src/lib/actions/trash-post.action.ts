import { createAction, Property } from '@activepieces/pieces-framework';
import { wordpressAuth } from '../..';
import { wordpressApi } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { postEditOutputSchema } from '../output-schemas';

export const trashPostAction = createAction({
  auth: wordpressAuth,
  name: 'trash_post',
  classification: 'DESTRUCTIVE',
  displayName: 'Move Post to Trash',
  description: 'Moves a blog post to the trash, where it can still be restored.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves a WordPress blog post to the trash; it can be restored from the WordPress admin until the trash is emptied. Prefer this over delete_post_permanently unless the post must be gone for good. Calling it on a post that is already trashed returns the post unchanged, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: postEditOutputSchema,
  props: {
    post_id: Property.Number({
      displayName: 'Post ID',
      description: 'ID of the post to trash, from list_posts.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = wordpressContent.requireWholeNumber({ value: propsValue.post_id, propName: 'Post ID' });
    return wordpressApi.trashItem({ auth, collection: 'posts', id });
  },
});
