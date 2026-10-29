import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditThing } from '../../common/client';
import { redditCreateCommentOutputSchema } from '../../output-schemas';

export const redditCreateComment = createAction({
  auth: redditAuth,
  name: 'reddit_create_comment',
  outputSchema: redditCreateCommentOutputSchema,
  displayName: 'Create Comment',
  description: 'Replies to a post, a comment or a private message.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Posts a reply: to a post (t3_ parent), a comment (t1_ parent) or a private message (t4_ parent). The parent id must carry its type prefix; it is the `name` field of the item. Fails on locked or archived threads. Not idempotent: every call posts a new reply.',
    idempotent: false,
  },
  props: {
    parent_id: Property.ShortText({ displayName: 'Parent Fullname', description: 'Fullname to reply to, e.g. "t3_abc123", "t1_def456" or "t4_ghi789".', required: true }),
    text: Property.LongText({ displayName: 'Text', description: 'Markdown body of the reply.', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await redditApi.request<ThingsResponse>({
      auth,
      method: HttpMethod.POST,
      path: '/api/comment',
      form: {
        api_type: 'json',
        thing_id: redditApi.requireFullname({ value: propsValue.parent_id, label: 'Parent Fullname' }),
        text: propsValue.text,
      },
    });
    const thing = response.json.data?.things?.[0];
    return thing ? redditApi.toThing({ thing }) : { success: true };
  },
});

type ThingsResponse = {
  json: { data?: { things?: RedditThing[] } };
};
