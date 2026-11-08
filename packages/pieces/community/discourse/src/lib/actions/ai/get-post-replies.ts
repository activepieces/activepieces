import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const getPostRepliesAction = createAction({
  auth: discourseAuth,
  name: 'get_post_replies',
  classification: 'READ',
  displayName: 'Get Post Replies',
  description: 'Returns the direct replies to a Discourse post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get the posts that directly reply to one Discourse post, by numeric post ID. For the whole thread use Get Topic Posts. Read-only.',
    idempotent: true,
  },
  props: {
    post_id: Property.ShortText({ displayName: 'Post ID', description: 'Numeric post ID.', required: true }),
  },
  outputSchema: discourseSchemas.postList,
  async run({ auth, propsValue }) {
    const id = discourseInput.id({ value: propsValue.post_id, label: 'Post ID' });
    const body = await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: `/posts/${id}/replies.json` });
    const base = discourseOps.baseUrl(auth.props);
    const items = discourseMap.list(body).map((raw) => discourseMap.post({ raw, baseUrl: base }));
    return { items, count: items.length, has_more: false };
  },
});
