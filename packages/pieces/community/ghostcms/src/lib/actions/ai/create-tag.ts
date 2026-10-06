import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostResource } from '../../common/resources';
import { TAG_FIELDS, tagProps } from '../../common/tag-props';
import { ghostCreateTagOutputSchema } from '../../output-schemas';

export const ghostCreateTag = createAction({
  auth: ghostAuth,
  name: 'ghost_create_tag',
  outputSchema: ghostCreateTagOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Tag',
  description: 'Create a post tag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a post tag. Not needed before tagging a post, because Create Post and Update Post create missing tags by name. Each call creates a new tag, so check List Tags first to avoid duplicates.',
    idempotent: false,
  },
  props: tagProps('create'),
  async run(context) {
    return ghostResource.create(context.auth, 'tags', ghostResource.pick(context.propsValue, TAG_FIELDS));
  },
});
