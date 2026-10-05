import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest, ResourceList } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryListResourcesOutputSchema } from '../../output-schemas';

export const cloudinaryListResources = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_list_resources',
  outputSchema: cloudinaryListResourcesOutputSchema,
  displayName: 'List Resources',
  description: 'Lists assets of one resource type and delivery type, optionally filtered by public ID prefix.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists assets of one resource type (image, video or raw) and delivery type, newest first, optionally narrowed by a public ID prefix or start date. Use for browsing; prefer Search Assets for filtering by tags, format, size or other attributes. Pages with next_cursor (max 500 per page).',
    idempotent: true,
  },
  props: {
    resource_type: aiProps.resourceType({ required: true }),
    type: aiProps.deliveryType(),
    prefix: Property.ShortText({
      displayName: 'Public ID Prefix',
      description: 'Only return assets whose public ID starts with this value (e.g. "products/").',
      required: false,
    }),
    start_at: Property.ShortText({
      displayName: 'Start At',
      description: 'Only return assets created after this ISO 8601 date-time. Cannot be combined with Next Cursor.',
      required: false,
    }),
    direction: aiProps.direction(),
    include_tags: aiProps.includeFlag({ displayName: 'Include Tags', description: 'Include each asset\'s tags.' }),
    include_context: aiProps.includeFlag({ displayName: 'Include Context', description: 'Include each asset\'s contextual metadata.' }),
    include_metadata: aiProps.includeFlag({ displayName: 'Include Structured Metadata', description: 'Include each asset\'s structured metadata values.' }),
    max_results: aiProps.maxResults(),
    next_cursor: aiProps.nextCursor(),
  },
  async run({ auth, propsValue }) {
    const type = propsValue.type ?? 'upload';
    const response: ResourceList = await makeRequest(auth, HttpMethod.GET, `/resources/${propsValue.resource_type}/${type}`, undefined, {
        prefix: propsValue.prefix,
        start_at: propsValue.start_at,
        direction: propsValue.direction,
        tags: propsValue.include_tags || undefined,
        context: propsValue.include_context || undefined,
        metadata: propsValue.include_metadata || undefined,
        max_results: aiResults.clampMaxResults({ value: propsValue.max_results }),
        next_cursor: propsValue.next_cursor,
      });
    return aiResults.toResourceList({ response });
  },
});
