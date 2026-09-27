import { createAction, Property } from '@activepieces/pieces-framework';
import { wordpressAuth } from '../..';
import { wordpressApi } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { createCategoryOutputSchema } from '../output-schemas';

export const createCategoryAction = createAction({
  auth: wordpressAuth,
  name: 'create_category',
  classification: 'WRITE',
  displayName: 'Create Category',
  description: 'Creates a post category, or returns the existing one with the same name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets or creates a WordPress post category by name. If a category with that name already exists under the same parent it is returned unchanged with created=false (its description is not updated); otherwise a new one is created with created=true. Use the returned ID in create_blog_post. Safe to retry.',
    idempotent: true,
  },
  outputSchema: createCategoryOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Category name.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Category description, used only when a new category is created.',
      required: false,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      description: 'URL slug. Leave empty to generate it from the name. Fails if another category already uses it.',
      required: false,
    }),
    parent: Property.Number({
      displayName: 'Parent Category ID',
      description: 'ID of the parent category, from list_categories. Leave empty for a top-level category.',
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
    if (wordpressContent.isSetNumber(propsValue.parent)) {
      body['parent'] = wordpressContent.requireWholeNumber({
        value: propsValue.parent,
        propName: 'Parent Category ID',
      });
    }
    return wordpressApi.getOrCreateTerm({ auth, taxonomy: 'categories', body });
  },
});
