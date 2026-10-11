import { createAction, Property } from '@activepieces/pieces-framework';
import { wordpressAuth } from '../..';
import { wordpressApi } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { deleteTagOutputSchema } from '../output-schemas';

export const deleteTagAction = createAction({
  auth: wordpressAuth,
  name: 'delete_tag',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Tag',
  description: 'Permanently deletes a post tag. This cannot be undone.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a WordPress tag and removes it from every post; tags have no trash. To take a tag off one post only, use update_blog_post with the new tag list. A repeat call fails because the tag no longer exists.',
    idempotent: false,
  },
  outputSchema: deleteTagOutputSchema,
  props: {
    tag_id: Property.Number({
      displayName: 'Tag ID',
      description: 'ID of the tag to delete, from list_tags.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = wordpressContent.requireWholeNumber({ value: propsValue.tag_id, propName: 'Tag ID' });
    return wordpressApi.forceDelete({ auth, path: `/tags/${id}` });
  },
});
