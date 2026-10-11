import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditSaveContentOutputSchema } from '../../output-schemas';

export const redditSaveContent = createAction({
  auth: redditAuth,
  name: 'reddit_save_content',
  outputSchema: redditSaveContentOutputSchema,
  displayName: 'Save Post or Comment',
  description: 'Saves a post or comment to your saved items.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Saves a post (t3_) or comment (t1_) to your account\'s saved items; saving twice is harmless. Category only applies to Reddit Premium accounts (see List Saved Categories). Read saved items with List User Content (where = saved). Needs the `save` scope: older connections must reconnect.',
    idempotent: true,
  },
  props: {
    thing_id: Property.ShortText({ displayName: 'Fullname', description: 'Fullname of the post or comment, e.g. "t3_abc123".', required: true }),
    category: Property.ShortText({ displayName: 'Category', description: 'Saved category (Reddit Premium only).', required: false }),
  },
  async run({ auth, propsValue }) {
    const id = redditApi.requireFullname({ value: propsValue.thing_id, label: 'Fullname' });
    await redditApi.request<unknown>({ auth, method: HttpMethod.POST, path: '/api/save', form: { id, category: propsValue.category } });
    return { success: true, id, saved: true };
  },
});
