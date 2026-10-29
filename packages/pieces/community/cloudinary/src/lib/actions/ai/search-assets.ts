import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest, ResourceList } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinarySearchAssetsOutputSchema } from '../../output-schemas';

export const cloudinarySearchAssets = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_search_assets',
  outputSchema: cloudinarySearchAssetsOutputSchema,
  displayName: 'Search Assets',
  description: 'Searches assets with a Cloudinary search expression.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches all assets with a Lucene-like expression, e.g. `resource_type:image AND tags:sale AND uploaded_at>1d`, `folder:products/*`, `format:png AND bytes>1mb`, or `metadata.sku=123`. Use this for any attribute filter; simple browsing by type or tag can use List Resources or List Resources by Tag. Newly uploaded assets can take a few seconds to become searchable. Pages with next_cursor (max 500).',
    idempotent: true,
  },
  props: {
    expression: Property.LongText({
      displayName: 'Expression',
      description: 'Search expression (e.g. "resource_type:image AND tags:sale"). Leave empty to match all assets.',
      required: false,
    }),
    sort_by: Property.ShortText({
      displayName: 'Sort By Field',
      description: 'Field to sort by (e.g. "created_at", "public_id", "bytes"). Defaults to relevance, then created_at.',
      required: false,
    }),
    sort_direction: aiProps.direction(),
    with_field: Property.StaticMultiSelectDropdown({
      displayName: 'Include Fields',
      description: 'Extra data to return for each asset.',
      required: false,
      options: {
        options: ['tags', 'context', 'metadata', 'image_metadata', 'image_analysis', 'quality_analysis', 'accessibility_analysis'].map((value) => ({ label: value, value })),
      },
    }),
    max_results: aiProps.maxResults(),
    next_cursor: aiProps.nextCursor(),
  },
  async run({ auth, propsValue }) {
    const sortBy = propsValue.sort_by?.trim();
    const body = {
      ...(propsValue.expression ? { expression: propsValue.expression } : {}),
      ...(sortBy ? { sort_by: [{ [sortBy]: propsValue.sort_direction ?? 'desc' }] } : {}),
      ...(propsValue.with_field && propsValue.with_field.length > 0 ? { with_field: propsValue.with_field } : {}),
      ...(propsValue.max_results !== undefined && propsValue.max_results !== null ? { max_results: aiResults.clampMaxResults({ value: propsValue.max_results }) } : {}),
      ...(propsValue.next_cursor ? { next_cursor: propsValue.next_cursor } : {}),
    };
    const response: ResourceList = await makeRequest(auth, HttpMethod.POST, '/resources/search', body);
    return aiResults.toResourceList({ response });
  },
});
