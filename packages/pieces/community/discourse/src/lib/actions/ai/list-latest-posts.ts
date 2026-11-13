import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const listLatestPostsAction = createAction({
  auth: discourseAuth,
  name: 'list_latest_posts',
  classification: 'SEARCH',
  displayName: 'List Latest Posts',
  description: 'Lists the newest posts across all public topics.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the newest Discourse posts across all topics the API user can see, newest first. To page back, pass next_before from the previous result as Before Post ID. Read-only.',
    idempotent: true,
  },
  props: {
    before: Property.ShortText({ displayName: 'Before Post ID', description: 'Only posts with a lower ID than this.', required: false }),
  },
  outputSchema: discourseSchemas.postPage,
  async run({ auth, propsValue }) {
    const before = discourseInput.optionalId({ value: propsValue.before, label: 'Before Post ID' });
    const body = discourseMap.rec(
      await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: '/posts.json', query: { before } }),
    );
    const base = discourseOps.baseUrl(auth.props);
    const items = discourseMap.list(body['latest_posts']).map((raw) => discourseMap.post({ raw, baseUrl: base }));
    const ids = items.map((item) => item.id).filter((id): id is number => id !== null);
    const lowest = ids.reduce<number | null>((min, id) => (min === null || id < min ? id : min), null);
    const hasMore = items.length > 0 && lowest !== null && lowest > 1;
    return { items, count: items.length, next_before: hasMore ? lowest : null, has_more: hasMore };
  },
});
