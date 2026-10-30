import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest, ResourceList } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryListResourcesOutputSchema } from '../../output-schemas';

export const cloudinaryListResourcesByTag = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_list_resources_by_tag',
  outputSchema: cloudinaryListResourcesOutputSchema,
  displayName: 'List Resources by Tag',
  description: 'Lists assets of one resource type that carry a given tag.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists assets of one resource type that carry an exact tag. Use when you know the tag; List Tags returns the available tag names. Pages with next_cursor (max 500 per page).',
    idempotent: true,
  },
  props: {
    resource_type: aiProps.resourceType({ required: true }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'The exact tag to match. Use List Tags to find existing tags.',
      required: true,
    }),
    direction: aiProps.direction(),
    include_tags: aiProps.includeFlag({ displayName: 'Include Tags', description: 'Include each asset\'s tags.' }),
    include_context: aiProps.includeFlag({ displayName: 'Include Context', description: 'Include each asset\'s contextual metadata.' }),
    include_metadata: aiProps.includeFlag({ displayName: 'Include Structured Metadata', description: 'Include each asset\'s structured metadata values.' }),
    max_results: aiProps.maxResults(),
    next_cursor: aiProps.nextCursor(),
  },
  async run({ auth, propsValue }) {
    const response: ResourceList = await makeRequest(auth, HttpMethod.GET, `/resources/${propsValue.resource_type}/tags/${encodeURIComponent(propsValue.tag.trim())}`, undefined, {
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
