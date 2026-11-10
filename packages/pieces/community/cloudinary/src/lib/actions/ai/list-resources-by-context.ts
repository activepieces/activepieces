import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest, ResourceList } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryListResourcesByAssetIdsOutputSchema } from '../../output-schemas';

export const cloudinaryListResourcesByContext = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_list_resources_by_context',
  outputSchema: cloudinaryListResourcesByAssetIdsOutputSchema,
  displayName: 'List Resources by Context',
  description: 'Lists assets that have a contextual metadata key, optionally with a specific value.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists assets of one resource type whose contextual metadata (free-form key=value pairs such as alt or caption) contains the given key, optionally matching an exact value. For structured metadata fields use Search Assets instead. Pages with next_cursor.',
    idempotent: true,
  },
  props: {
    resource_type: aiProps.resourceType({ required: true }),
    key: Property.ShortText({
      displayName: 'Context Key',
      description: 'The contextual metadata key to match (e.g. "alt", "caption").',
      required: true,
    }),
    value: Property.ShortText({
      displayName: 'Context Value',
      description: 'Only return assets where the key has exactly this value. Leave empty to match any value.',
      required: false,
    }),
    direction: aiProps.direction(),
    max_results: aiProps.maxResults(),
    next_cursor: aiProps.nextCursor(),
  },
  async run({ auth, propsValue }) {
    const response: ResourceList = await makeRequest(auth, HttpMethod.GET, `/resources/${propsValue.resource_type}/context`, undefined, {
        key: propsValue.key.trim(),
        value: propsValue.value,
        direction: propsValue.direction,
        max_results: aiResults.clampMaxResults({ value: propsValue.max_results }),
        next_cursor: propsValue.next_cursor,
      });
    return aiResults.toResourceList({ response });
  },
});
