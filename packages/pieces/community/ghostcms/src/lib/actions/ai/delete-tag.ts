import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostDeleteTagOutputSchema } from '../../output-schemas';

export const ghostDeleteTag = createAction({
  auth: ghostAuth,
  name: 'ghost_delete_tag',
  outputSchema: ghostDeleteTagOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Tag',
  description: 'Permanently delete a tag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a tag and removes it from every post that has it; the posts themselves stay. It cannot be restored, and a retry fails with not found.',
    idempotent: false,
  },
  props: {
    tag_id: ghostProps.id('Tag ID', 'The tag ID, from List Tags.'),
  },
  async run(context) {
    const tag_id = context.propsValue.tag_id.trim();
    await ghostResource.remove(context.auth, 'tags', ghostCommon.id(tag_id, 'Tag ID'));
    return { success: true, tag_id };
  },
});
