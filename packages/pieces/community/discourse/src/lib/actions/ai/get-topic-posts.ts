import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const getTopicPostsAction = createAction({
  auth: discourseAuth,
  name: 'get_topic_posts',
  classification: 'READ',
  displayName: 'Get Topic Posts',
  description: 'Returns the posts of a Discourse topic in order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get the posts (replies) of a Discourse topic in reading order, by numeric topic ID, with Offset and Limit (max 100) for paging; next_offset is set when more posts remain. Read-only.',
    idempotent: true,
  },
  props: {
    topic_id: Property.ShortText({ displayName: 'Topic ID', description: 'Numeric topic ID.', required: true }),
    offset: Property.Number({ displayName: 'Offset', description: 'Number of posts to skip. Default 0.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Posts to return, 1 to 100. Default 20.', required: false }),
  },
  outputSchema: discourseSchemas.topicPosts,
  async run({ auth, propsValue }) {
    const id = discourseInput.id({ value: propsValue.topic_id, label: 'Topic ID' });
    const offset = discourseInput.boundedNumber({ value: propsValue.offset, label: 'Offset', min: 0, max: 1000000, fallback: 0 });
    const limit = discourseInput.boundedNumber({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 20 });
    const topic = discourseMap.rec(await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: `/t/${id}.json` }));
    const stream = discourseMap
      .list(discourseMap.rec(topic['post_stream'])['stream'])
      .map((postId) => discourseMap.num(postId))
      .filter((postId): postId is number => postId !== null);
    const wanted = stream.slice(offset, offset + limit);
    const base = discourseOps.baseUrl(auth.props);
    const posts =
      wanted.length === 0
        ? []
        : discourseMap.list(
            discourseMap.rec(
              discourseMap.rec(
                await discourseRequest({
                  auth: auth.props,
                  method: HttpMethod.GET,
                  path: `/t/${id}/posts.json`,
                  query: { post_ids: wanted },
                }),
              )['post_stream'],
            )['posts'],
          );
    const items = posts
      .map((raw) => discourseMap.post({ raw, baseUrl: base }))
      .sort((a, b) => (a.post_number ?? 0) - (b.post_number ?? 0));
    const nextOffset = offset + wanted.length;
    return {
      topic_id: Number(id),
      items,
      count: items.length,
      total_posts: stream.length,
      offset,
      next_offset: nextOffset < stream.length ? nextOffset : null,
      has_more: nextOffset < stream.length,
    };
  },
});
