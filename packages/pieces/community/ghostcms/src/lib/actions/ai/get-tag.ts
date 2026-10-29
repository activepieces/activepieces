import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostTagOutputSchema } from '../../output-schemas';

export const ghostGetTag = createAction({
  auth: ghostAuth,
  name: 'ghost_get_tag',
  outputSchema: ghostTagOutputSchema,
  classification: 'READ',
  displayName: 'Get Tag',
  description: 'Get a tag by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one tag by ID with its description, visibility and post count. Use Get Tag by Slug when only the slug is known.',
    idempotent: true,
  },
  props: {
    tag_id: ghostProps.id('Tag ID', 'The tag ID, from List Tags.'),
  },
  async run(context) {
    return ghostResource.get(context.auth, 'tags', ghostCommon.id(context.propsValue.tag_id, 'Tag ID'), {
      include: 'count.posts',
    });
  },
});
