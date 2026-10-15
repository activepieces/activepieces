import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostContent } from '../../common/content';
import { ghostListPostsOutputSchema } from '../../output-schemas';

export const ghostListPosts = createAction({
  auth: ghostAuth,
  name: 'ghost_list_posts',
  outputSchema: ghostListPostsOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Posts',
  description: 'List or search posts with an optional filter.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists posts of any status with pagination totals, optionally narrowed by an NQL filter such as status:draft or tag:news. Use it to find a post ID or slug; use Get Post for one post with its full HTML.',
    idempotent: true,
  },
  props: {
    filter: ghostProps.filter("status:published+tag:news or title:~'launch'"),
    limit: ghostProps.limit,
    page: ghostProps.page,
    order: ghostProps.order('published_at desc'),
    include_content: Property.Checkbox({
      displayName: 'Include Content',
      description: 'Return the HTML body of each post. Off by default to keep the result small.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    return ghostContent.list(context.auth, 'posts', context.propsValue);
  },
});
