import { createAction, Property } from '@activepieces/pieces-framework';
import { wordpressAuth } from '../..';
import { wordpressApi } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { createTagOutputSchema } from '../output-schemas';

export const createTagAction = createAction({
  auth: wordpressAuth,
  name: 'create_tag',
  classification: 'WRITE',
  displayName: 'Create Tag',
  description: 'Creates a post tag, or returns the existing one with the same name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets or creates a WordPress post tag by name. If a tag with that name already exists it is returned unchanged with created=false; otherwise a new one is created with created=true. Use the returned ID in create_blog_post. Safe to retry.',
    idempotent: true,
  },
  outputSchema: createTagOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Tag name.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Tag description, used only when a new tag is created.',
      required: false,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      description: 'URL slug. Leave empty to generate it from the name. Fails if another tag already uses it.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = { name: propsValue.name };
    if (wordpressContent.isFilledText(propsValue.description)) {
      body['description'] = propsValue.description;
    }
    if (wordpressContent.isFilledText(propsValue.slug)) {
      body['slug'] = propsValue.slug;
    }
    return wordpressApi.getOrCreateTerm({ auth, taxonomy: 'tags', body });
  },
});
