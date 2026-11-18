import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const getPostAction = createAction({
  auth: discourseAuth,
  name: 'get_post',
  classification: 'READ',
  displayName: 'Get Post',
  description: 'Returns a Discourse post by ID, with Markdown and HTML.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get one Discourse post by numeric post ID (not the post number inside a topic), including its Markdown source and rendered HTML. Read-only.',
    idempotent: true,
  },
  props: {
    post_id: Property.ShortText({ displayName: 'Post ID', description: 'Numeric post ID.', required: true }),
  },
  outputSchema: discourseSchemas.post,
  async run({ auth, propsValue }) {
    const id = discourseInput.id({ value: propsValue.post_id, label: 'Post ID' });
    const body = await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: `/posts/${id}.json` });
    return discourseMap.post({ raw: body, baseUrl: discourseOps.baseUrl(auth.props) });
  },
});
