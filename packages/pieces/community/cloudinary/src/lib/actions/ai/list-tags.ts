import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryListTagsOutputSchema } from '../../output-schemas';

export const cloudinaryListTags = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_list_tags',
  outputSchema: cloudinaryListTagsOutputSchema,
  displayName: 'List Tags',
  description: 'Lists the tags used on assets of one resource type.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the tag names in use on assets of one resource type, optionally only those starting with a prefix. Use to discover tags before List Resources by Tag or Delete Resources by Tag. Pages with next_cursor (max 500).',
    idempotent: true,
  },
  props: {
    resource_type: aiProps.resourceType({ required: true }),
    prefix: Property.ShortText({
      displayName: 'Prefix',
      description: 'Only return tags starting with this value.',
      required: false,
    }),
    max_results: aiProps.maxResults(),
    next_cursor: aiProps.nextCursor(),
  },
  async run({ auth, propsValue }) {
    const response: { tags: string[]; next_cursor?: string } = await makeRequest(auth, HttpMethod.GET, `/tags/${propsValue.resource_type}`, undefined, {
        prefix: propsValue.prefix,
        max_results: aiResults.clampMaxResults({ value: propsValue.max_results }),
        next_cursor: propsValue.next_cursor,
      });
    return { tags: response.tags, count: response.tags.length, next_cursor: response.next_cursor ?? null };
  },
});
