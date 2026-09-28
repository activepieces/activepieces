import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostTagOutputSchema } from '../../output-schemas';

export const ghostGetTagBySlug = createAction({
  auth: ghostAuth,
  name: 'ghost_get_tag_by_slug',
  outputSchema: ghostTagOutputSchema,
  classification: 'READ',
  displayName: 'Get Tag by Slug',
  description: 'Get a tag by its slug.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one tag by its slug, e.g. "news" from /tag/news/, with its post count. Use Get Tag when the ID is known.',
    idempotent: true,
  },
  props: {
    slug: ghostProps.slug('The tag slug, e.g. "news".'),
  },
  async run(context) {
    return ghostResource.get(context.auth, 'tags', `slug/${ghostCommon.id(context.propsValue.slug, 'Slug')}`, {
      include: 'count.posts',
    });
  },
});
