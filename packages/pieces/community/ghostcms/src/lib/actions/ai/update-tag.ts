import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { applyClearFields, clearFieldsProp } from '../../common/clear-fields';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { TAG_FIELDS, tagProps } from '../../common/tag-props';
import { ghostCreateTagOutputSchema } from '../../output-schemas';

export const ghostUpdateTag = createAction({
  auth: ghostAuth,
  name: 'ghost_update_tag',
  outputSchema: ghostCreateTagOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Tag',
  description: 'Update the name or settings of a tag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edits a tag by ID; only the inputs you supply change, and Clear Fields blanks the description, accent color or SEO fields. Changing the slug changes the tag page URL.',
    idempotent: true,
  },
  props: {
    tag_id: ghostProps.id('Tag ID', 'The tag ID, from List Tags.'),
    ...tagProps('update'),
    clear_fields: clearFieldsProp([
      { label: 'Description', value: 'description' },
      { label: 'Accent Color', value: 'accent_color' },
      { label: 'Meta Title', value: 'meta_title' },
      { label: 'Meta Description', value: 'meta_description' },
    ]),
  },
  async run(context) {
    const id = ghostCommon.id(context.propsValue.tag_id, 'Tag ID');
    const body = applyClearFields({
      body: ghostResource.pick(context.propsValue, TAG_FIELDS),
      clear: context.propsValue.clear_fields,
      allowed: ['description', 'accent_color', 'meta_title', 'meta_description'],
      clearValue: null,
    });
    return ghostResource.edit(context.auth, 'tags', id, body);
  },
});
