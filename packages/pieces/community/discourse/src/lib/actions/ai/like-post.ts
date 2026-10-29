import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { DiscourseApiError, discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const likePostAction = createAction({
  auth: discourseAuth,
  name: 'like_post',
  classification: 'WRITE',
  displayName: 'Like Post',
  description: 'Likes a Discourse post as the API user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Like a Discourse post by numeric post ID, as the connection API Username. The author is notified. Liking a post that is already liked is reported with already_liked true, so retries are safe.',
    idempotent: true,
  },
  props: {
    post_id: Property.ShortText({ displayName: 'Post ID', description: 'Numeric post ID.', required: true }),
  },
  outputSchema: discourseSchemas.like,
  async run({ auth, propsValue }) {
    const id = discourseInput.id({ value: propsValue.post_id, label: 'Post ID' });
    try {
      const body = await discourseRequest({
        auth: auth.props,
        method: HttpMethod.POST,
        path: '/post_actions.json',
        body: { id: Number(id), post_action_type_id: LIKE_ACTION_TYPE },
      });
      const post = discourseMap.post({ raw: body, baseUrl: discourseOps.baseUrl(auth.props) });
      return { post_id: Number(id), liked: true, already_liked: false, like_count: post.like_count };
    } catch (error) {
      if (!(error instanceof DiscourseApiError) || (error.status !== 403 && error.status !== 422)) {
        throw error;
      }
      const raw = discourseMap.rec(
        await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: `/posts/${id}.json` }),
      );
      const post = discourseMap.post({ raw, baseUrl: discourseOps.baseUrl(auth.props) });
      if (/already/i.test(error.message)) {
        return { post_id: Number(id), liked: true, already_liked: true, like_count: post.like_count };
      }
      if (raw['yours'] === true) {
        throw new Error('Discourse does not let a user like their own post. The API Username wrote this post.');
      }
      throw error;
    }
  },
});

const LIKE_ACTION_TYPE = 2;
