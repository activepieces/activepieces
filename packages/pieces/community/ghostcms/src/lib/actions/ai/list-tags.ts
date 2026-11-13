import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostListTagsOutputSchema } from '../../output-schemas';

export const ghostListTags = createAction({
  auth: ghostAuth,
  name: 'ghost_list_tags',
  outputSchema: ghostListTagsOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Tags',
  description: 'List or search post tags.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists post tags with their post counts and pagination totals, optionally narrowed by an NQL filter such as visibility:public. Use it to find a tag ID or slug.',
    idempotent: true,
  },
  props: {
    filter: ghostProps.filter("visibility:public or name:~'news'"),
    limit: ghostProps.limit,
    page: ghostProps.page,
    order: ghostProps.order('name asc'),
  },
  async run(context) {
    return ghostResource.list(context.auth, 'tags', {
      ...ghostCommon.listQuery(context.propsValue),
      include: 'count.posts',
    });
  },
});
